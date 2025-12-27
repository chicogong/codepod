use super::CommandResult;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::command;
use tokio::fs;

/// Expand ~ to home directory
fn expand_path(path: &str) -> PathBuf {
    if path.starts_with("~/") {
        if let Some(home) = dirs::home_dir() {
            return home.join(&path[2..]);
        }
    }
    PathBuf::from(path)
}

/// Read a config file
#[command]
pub async fn read_config_file(path: String) -> CommandResult<String> {
    let expanded = expand_path(&path);
    
    match fs::read_to_string(&expanded).await {
        Ok(content) => CommandResult::ok(content),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
            // Return empty object for non-existent files
            CommandResult::ok("{}".to_string())
        }
        Err(e) => CommandResult::err(format!("Failed to read {}: {}", path, e)),
    }
}

/// Write a config file
#[command]
pub async fn write_config_file(path: String, content: String) -> CommandResult<()> {
    let expanded = expand_path(&path);
    
    // Ensure parent directory exists
    if let Some(parent) = expanded.parent() {
        if let Err(e) = fs::create_dir_all(parent).await {
            return CommandResult::err(format!("Failed to create directory: {}", e));
        }
    }
    
    match fs::write(&expanded, content).await {
        Ok(()) => CommandResult::ok(()),
        Err(e) => CommandResult::err(format!("Failed to write {}: {}", path, e)),
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CommandInfo {
    pub name: String,
    pub description: Option<String>,
    pub content: String,
    pub enabled: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AgentInfo {
    pub name: String,
    pub description: Option<String>,
    pub system_prompt: String,
    pub tools: Vec<String>,
    pub enabled: bool,
}

/// List all commands from ~/.claude/commands/
#[command]
pub async fn list_commands() -> CommandResult<Vec<CommandInfo>> {
    let commands_dir = expand_path("~/.claude/commands");
    
    if !commands_dir.exists() {
        return CommandResult::ok(vec![]);
    }
    
    let mut commands = Vec::new();
    
    match fs::read_dir(&commands_dir).await {
        Ok(mut entries) => {
            while let Ok(Some(entry)) = entries.next_entry().await {
                let path = entry.path();
                if path.extension().map_or(false, |e| e == "md") {
                    if let Ok(content) = fs::read_to_string(&path).await {
                        let name = path.file_stem()
                            .and_then(|s| s.to_str())
                            .unwrap_or("unknown")
                            .to_string();
                        
                        // Parse frontmatter for description
                        let (description, body) = parse_frontmatter(&content);
                        
                        commands.push(CommandInfo {
                            name,
                            description,
                            content: body,
                            enabled: true,
                        });
                    }
                }
            }
            CommandResult::ok(commands)
        }
        Err(e) => CommandResult::err(format!("Failed to list commands: {}", e)),
    }
}

/// List all agents from ~/.claude/agents/
#[command]
pub async fn list_agents() -> CommandResult<Vec<AgentInfo>> {
    let agents_dir = expand_path("~/.claude/agents");
    
    if !agents_dir.exists() {
        return CommandResult::ok(vec![]);
    }
    
    let mut agents = Vec::new();
    
    match fs::read_dir(&agents_dir).await {
        Ok(mut entries) => {
            while let Ok(Some(entry)) = entries.next_entry().await {
                let path = entry.path();
                if path.extension().map_or(false, |e| e == "md") {
                    if let Ok(content) = fs::read_to_string(&path).await {
                        let name = path.file_stem()
                            .and_then(|s| s.to_str())
                            .unwrap_or("unknown")
                            .to_string();
                        
                        // Parse frontmatter for description
                        let (description, body) = parse_frontmatter(&content);
                        
                        agents.push(AgentInfo {
                            name,
                            description,
                            system_prompt: body,
                            tools: vec![],
                            enabled: true,
                        });
                    }
                }
            }
            CommandResult::ok(agents)
        }
        Err(e) => CommandResult::err(format!("Failed to list agents: {}", e)),
    }
}

/// Parse YAML frontmatter from markdown content
fn parse_frontmatter(content: &str) -> (Option<String>, String) {
    if content.starts_with("---") {
        if let Some(end) = content[3..].find("---") {
            let frontmatter = &content[3..end + 3];
            let body = content[end + 6..].trim().to_string();
            
            // Simple extraction of description field
            for line in frontmatter.lines() {
                if line.starts_with("description:") {
                    let desc = line["description:".len()..].trim();
                    return (Some(desc.trim_matches('"').to_string()), body);
                }
            }
            
            return (None, body);
        }
    }
    (None, content.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_expand_path_home() {
        let path = expand_path("~/.claude/settings.json");
        assert!(path.to_string_lossy().contains(".claude"));
    }

    #[test]
    fn test_expand_path_absolute() {
        let path = expand_path("/tmp/test.json");
        assert_eq!(path, PathBuf::from("/tmp/test.json"));
    }

    #[test]
    fn test_parse_frontmatter() {
        let content = r#"---
description: "Test command"
---

Command content here"#;
        
        let (desc, body) = parse_frontmatter(content);
        assert_eq!(desc, Some("Test command".to_string()));
        assert_eq!(body, "Command content here");
    }

    #[test]
    fn test_parse_frontmatter_no_frontmatter() {
        let content = "Just plain content";
        let (desc, body) = parse_frontmatter(content);
        assert_eq!(desc, None);
        assert_eq!(body, "Just plain content");
    }
}
