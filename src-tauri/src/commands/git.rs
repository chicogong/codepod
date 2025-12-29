use serde::{Deserialize, Serialize};
use std::process::Command;
use std::path::Path;

use super::CommandResult;

/// Git file status
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GitFileStatus {
    pub path: String,
    pub status: String,      // M, A, D, R, C, U, ?
    pub staged: bool,
    pub status_text: String, // "modified", "added", "deleted", etc.
}

/// Git repository status
#[derive(Debug, Serialize, Deserialize)]
pub struct GitStatus {
    pub is_repo: bool,
    pub branch: Option<String>,
    pub ahead: u32,
    pub behind: u32,
    pub staged_count: u32,
    pub unstaged_count: u32,
    pub untracked_count: u32,
    pub files: Vec<GitFileStatus>,
    pub has_conflicts: bool,
}

/// Git branch information
#[derive(Debug, Serialize, Deserialize)]
pub struct GitBranch {
    pub name: String,
    pub is_current: bool,
    pub is_remote: bool,
}

/// Check if directory is a git repository
fn is_git_repo(path: &Path) -> bool {
    path.join(".git").exists() || {
        // Check if we're in a subdirectory of a git repo
        Command::new("git")
            .args(["rev-parse", "--git-dir"])
            .current_dir(path)
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false)
    }
}

/// Parse git status --porcelain output
fn parse_status_line(line: &str) -> Option<GitFileStatus> {
    if line.len() < 4 {
        return None;
    }
    
    let staged_char = line.chars().next()?;
    let unstaged_char = line.chars().nth(1)?;
    let path = line[3..].to_string();
    
    let (status, staged) = if staged_char != ' ' && staged_char != '?' {
        (staged_char.to_string(), true)
    } else {
        (unstaged_char.to_string(), false)
    };
    
    let status_text = match status.as_str() {
        "M" => "modified",
        "A" => "added",
        "D" => "deleted",
        "R" => "renamed",
        "C" => "copied",
        "U" => "unmerged",
        "?" => "untracked",
        "!" => "ignored",
        _ => "unknown",
    }.to_string();
    
    Some(GitFileStatus {
        path,
        status,
        staged,
        status_text,
    })
}

/// Get git repository status
#[tauri::command]
pub fn get_git_status(path: String) -> CommandResult<GitStatus> {
    let dir_path = Path::new(&path);
    
    if !dir_path.exists() {
        return CommandResult::err(format!("Path does not exist: {}", path));
    }
    
    if !is_git_repo(dir_path) {
        return CommandResult::ok(GitStatus {
            is_repo: false,
            branch: None,
            ahead: 0,
            behind: 0,
            staged_count: 0,
            unstaged_count: 0,
            untracked_count: 0,
            files: vec![],
            has_conflicts: false,
        });
    }
    
    // Get current branch
    let branch = Command::new("git")
        .args(["branch", "--show-current"])
        .current_dir(dir_path)
        .output()
        .ok()
        .and_then(|o| {
            if o.status.success() {
                Some(String::from_utf8_lossy(&o.stdout).trim().to_string())
            } else {
                None
            }
        })
        .filter(|s| !s.is_empty());
    
    // Get ahead/behind counts
    let (ahead, behind) = if branch.is_some() {
        Command::new("git")
            .args(["rev-list", "--left-right", "--count", "HEAD...@{upstream}"])
            .current_dir(dir_path)
            .output()
            .ok()
            .and_then(|o| {
                if o.status.success() {
                    let output = String::from_utf8_lossy(&o.stdout);
                    let parts: Vec<&str> = output.trim().split('\t').collect();
                    if parts.len() == 2 {
                        let ahead = parts[0].parse().unwrap_or(0);
                        let behind = parts[1].parse().unwrap_or(0);
                        return Some((ahead, behind));
                    }
                }
                None
            })
            .unwrap_or((0, 0))
    } else {
        (0, 0)
    };
    
    // Get file status
    let status_output = Command::new("git")
        .args(["status", "--porcelain", "-u"])
        .current_dir(dir_path)
        .output();
    
    let mut files = Vec::new();
    let mut staged_count = 0;
    let mut unstaged_count = 0;
    let mut untracked_count = 0;
    let mut has_conflicts = false;
    
    if let Ok(output) = status_output {
        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            for line in stdout.lines() {
                if let Some(file_status) = parse_status_line(line) {
                    if file_status.status == "U" {
                        has_conflicts = true;
                    }
                    if file_status.status == "?" {
                        untracked_count += 1;
                    } else if file_status.staged {
                        staged_count += 1;
                    } else {
                        unstaged_count += 1;
                    }
                    files.push(file_status);
                }
            }
        }
    }
    
    CommandResult::ok(GitStatus {
        is_repo: true,
        branch,
        ahead,
        behind,
        staged_count,
        unstaged_count,
        untracked_count,
        files,
        has_conflicts,
    })
}

/// Get current git branch name
#[tauri::command]
pub fn get_git_branch(path: String) -> CommandResult<Option<String>> {
    let dir_path = Path::new(&path);
    
    if !dir_path.exists() || !is_git_repo(dir_path) {
        return CommandResult::ok(None);
    }
    
    let output = Command::new("git")
        .args(["branch", "--show-current"])
        .current_dir(dir_path)
        .output();
    
    match output {
        Ok(o) if o.status.success() => {
            let branch = String::from_utf8_lossy(&o.stdout).trim().to_string();
            if branch.is_empty() {
                // Detached HEAD state
                let head = Command::new("git")
                    .args(["rev-parse", "--short", "HEAD"])
                    .current_dir(dir_path)
                    .output()
                    .ok()
                    .map(|o| format!("HEAD:{}", String::from_utf8_lossy(&o.stdout).trim()));
                CommandResult::ok(head)
            } else {
                CommandResult::ok(Some(branch))
            }
        }
        _ => CommandResult::ok(None),
    }
}

/// List all git branches
#[tauri::command]
pub fn list_git_branches(path: String) -> CommandResult<Vec<GitBranch>> {
    let dir_path = Path::new(&path);
    
    if !dir_path.exists() || !is_git_repo(dir_path) {
        return CommandResult::ok(vec![]);
    }
    
    let output = Command::new("git")
        .args(["branch", "-a", "--format=%(refname:short)%(HEAD)"])
        .current_dir(dir_path)
        .output();
    
    match output {
        Ok(o) if o.status.success() => {
            let stdout = String::from_utf8_lossy(&o.stdout);
            let branches: Vec<GitBranch> = stdout
                .lines()
                .filter(|line| !line.is_empty())
                .map(|line| {
                    let is_current = line.ends_with('*');
                    let name = line.trim_end_matches('*').to_string();
                    let is_remote = name.starts_with("remotes/") || name.starts_with("origin/");
                    GitBranch {
                        name,
                        is_current,
                        is_remote,
                    }
                })
                .collect();
            CommandResult::ok(branches)
        }
        _ => CommandResult::ok(vec![]),
    }
}

/// Get recent git commits
#[derive(Debug, Serialize, Deserialize)]
pub struct GitCommit {
    pub hash: String,
    pub short_hash: String,
    pub message: String,
    pub author: String,
    pub date: String,
}

#[tauri::command]
pub fn get_git_log(path: String, count: Option<u32>) -> CommandResult<Vec<GitCommit>> {
    let dir_path = Path::new(&path);
    let limit = count.unwrap_or(10);
    
    if !dir_path.exists() || !is_git_repo(dir_path) {
        return CommandResult::ok(vec![]);
    }
    
    let output = Command::new("git")
        .args([
            "log",
            &format!("-{}", limit),
            "--format=%H|%h|%s|%an|%ar",
        ])
        .current_dir(dir_path)
        .output();
    
    match output {
        Ok(o) if o.status.success() => {
            let stdout = String::from_utf8_lossy(&o.stdout);
            let commits: Vec<GitCommit> = stdout
                .lines()
                .filter_map(|line| {
                    let parts: Vec<&str> = line.splitn(5, '|').collect();
                    if parts.len() == 5 {
                        Some(GitCommit {
                            hash: parts[0].to_string(),
                            short_hash: parts[1].to_string(),
                            message: parts[2].to_string(),
                            author: parts[3].to_string(),
                            date: parts[4].to_string(),
                        })
                    } else {
                        None
                    }
                })
                .collect();
            CommandResult::ok(commits)
        }
        _ => CommandResult::ok(vec![]),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;
    
    #[test]
    fn test_get_git_status() {
        let current_dir = env::current_dir().unwrap();
        let result = get_git_status(current_dir.to_string_lossy().to_string());
        assert!(result.success);
    }
    
    #[test]
    fn test_get_git_branch() {
        let current_dir = env::current_dir().unwrap();
        let result = get_git_branch(current_dir.to_string_lossy().to_string());
        assert!(result.success);
    }
    
    #[test]
    fn test_parse_status_line() {
        let modified = parse_status_line(" M src/main.rs");
        assert!(modified.is_some());
        let m = modified.unwrap();
        assert_eq!(m.status, "M");
        assert!(!m.staged);
        
        let staged = parse_status_line("M  src/main.rs");
        assert!(staged.is_some());
        let s = staged.unwrap();
        assert_eq!(s.status, "M");
        assert!(s.staged);
        
        let untracked = parse_status_line("?? new_file.txt");
        assert!(untracked.is_some());
        let u = untracked.unwrap();
        assert_eq!(u.status, "?");
    }
}
