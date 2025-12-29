use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

use super::CommandResult;

/// File or directory entry information
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub is_file: bool,
    pub is_hidden: bool,
    pub size: Option<u64>,
    pub extension: Option<String>,
}

/// Directory listing result
#[derive(Debug, Serialize, Deserialize)]
pub struct DirectoryListing {
    pub path: String,
    pub entries: Vec<FileEntry>,
    pub parent: Option<String>,
}

/// List directory contents
#[tauri::command]
pub fn list_directory(path: String) -> CommandResult<DirectoryListing> {
    let dir_path = Path::new(&path);
    
    if !dir_path.exists() {
        return CommandResult::err(format!("Path does not exist: {}", path));
    }
    
    if !dir_path.is_dir() {
        return CommandResult::err(format!("Path is not a directory: {}", path));
    }
    
    let mut entries = Vec::new();
    
    match fs::read_dir(dir_path) {
        Ok(read_dir) => {
            for entry_result in read_dir {
                match entry_result {
                    Ok(entry) => {
                        let file_name = entry.file_name().to_string_lossy().to_string();
                        let file_path = entry.path();
                        let metadata = entry.metadata().ok();
                        
                        let is_dir = file_path.is_dir();
                        let is_file = file_path.is_file();
                        let is_hidden = file_name.starts_with('.');
                        
                        let size = if is_file {
                            metadata.as_ref().map(|m| m.len())
                        } else {
                            None
                        };
                        
                        let extension = if is_file {
                            file_path
                                .extension()
                                .map(|e| e.to_string_lossy().to_string())
                        } else {
                            None
                        };
                        
                        entries.push(FileEntry {
                            name: file_name,
                            path: file_path.to_string_lossy().to_string(),
                            is_dir,
                            is_file,
                            is_hidden,
                            size,
                            extension,
                        });
                    }
                    Err(e) => {
                        // Log but continue with other entries
                        eprintln!("Error reading directory entry: {}", e);
                    }
                }
            }
        }
        Err(e) => {
            return CommandResult::err(format!("Failed to read directory: {}", e));
        }
    }
    
    // Sort: directories first, then files, alphabetically within each group
    entries.sort_by(|a, b| {
        match (a.is_dir, b.is_dir) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });
    
    // Get parent directory
    let parent = dir_path
        .parent()
        .map(|p| p.to_string_lossy().to_string());
    
    CommandResult::ok(DirectoryListing {
        path,
        entries,
        parent,
    })
}

/// Read file content as text
#[tauri::command]
pub fn read_file_content(path: String) -> CommandResult<String> {
    let file_path = Path::new(&path);
    
    if !file_path.exists() {
        return CommandResult::err(format!("File does not exist: {}", path));
    }
    
    if !file_path.is_file() {
        return CommandResult::err(format!("Path is not a file: {}", path));
    }
    
    match fs::read_to_string(file_path) {
        Ok(content) => CommandResult::ok(content),
        Err(e) => CommandResult::err(format!("Failed to read file: {}", e)),
    }
}

/// Get file metadata
#[tauri::command]
pub fn get_file_info(path: String) -> CommandResult<FileEntry> {
    let file_path = Path::new(&path);
    
    if !file_path.exists() {
        return CommandResult::err(format!("Path does not exist: {}", path));
    }
    
    let metadata = match fs::metadata(file_path) {
        Ok(m) => m,
        Err(e) => return CommandResult::err(format!("Failed to get metadata: {}", e)),
    };
    
    let file_name = file_path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();
    
    let is_dir = metadata.is_dir();
    let is_file = metadata.is_file();
    let is_hidden = file_name.starts_with('.');
    
    let size = if is_file { Some(metadata.len()) } else { None };
    
    let extension = if is_file {
        file_path
            .extension()
            .map(|e| e.to_string_lossy().to_string())
    } else {
        None
    };
    
    CommandResult::ok(FileEntry {
        name: file_name,
        path,
        is_dir,
        is_file,
        is_hidden,
        size,
        extension,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;
    
    #[test]
    fn test_list_directory_current() {
        let current_dir = env::current_dir().unwrap();
        let result = list_directory(current_dir.to_string_lossy().to_string());
        assert!(result.success);
        assert!(result.data.is_some());
    }
    
    #[test]
    fn test_list_directory_not_exists() {
        let result = list_directory("/nonexistent/path/12345".to_string());
        assert!(!result.success);
        assert!(result.error.is_some());
    }
    
    #[test]
    fn test_get_file_info() {
        let current_dir = env::current_dir().unwrap();
        let result = get_file_info(current_dir.to_string_lossy().to_string());
        assert!(result.success);
        if let Some(info) = result.data {
            assert!(info.is_dir);
        }
    }
}
