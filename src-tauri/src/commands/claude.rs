use super::CommandResult;
use serde::{Deserialize, Serialize};
use std::process::Stdio;
use tauri::{command, AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;

#[derive(Debug, Serialize, Deserialize)]
pub struct ClaudeOptions {
    pub model: Option<String>,
    pub session_id: Option<String>,
    pub continue_session: bool,
    pub cwd: Option<String>,
}

impl Default for ClaudeOptions {
    fn default() -> Self {
        Self {
            model: None,
            session_id: None,
            continue_session: false,
            cwd: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamEvent {
    pub event_type: String,
    pub data: serde_json::Value,
}

/// Get Claude CLI version
#[command]
pub async fn get_claude_version() -> CommandResult<String> {
    match Command::new("claude").arg("--version").output().await {
        Ok(output) => {
            if output.status.success() {
                let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
                CommandResult::ok(version)
            } else {
                CommandResult::err("Claude CLI not found or returned an error")
            }
        }
        Err(e) => CommandResult::err(format!("Failed to execute Claude CLI: {}", e)),
    }
}

/// Invoke Claude CLI with streaming output
#[command]
pub async fn invoke_claude_stream(
    app: AppHandle,
    prompt: String,
    request_id: String,
    options: Option<ClaudeOptions>,
) -> CommandResult<()> {
    let options = options.unwrap_or_default();

    let mut cmd = Command::new("claude");
    cmd.arg("-p").arg(&prompt);
    cmd.arg("--output-format").arg("stream-json");

    if let Some(model) = &options.model {
        cmd.arg("--model").arg(model);
    }

    if options.continue_session {
        cmd.arg("--continue");
    } else if let Some(session_id) = &options.session_id {
        cmd.arg("--resume").arg(session_id);
    }

    if let Some(cwd) = &options.cwd {
        cmd.current_dir(cwd);
    }

    cmd.stdout(Stdio::piped());
    cmd.stderr(Stdio::piped());

    let mut child = match cmd.spawn() {
        Ok(c) => c,
        Err(e) => return CommandResult::err(format!("Failed to spawn Claude: {}", e)),
    };

    let stdout = match child.stdout.take() {
        Some(s) => s,
        None => return CommandResult::err("Failed to capture stdout"),
    };

    let app_clone = app.clone();
    let request_id_clone = request_id.clone();

    // Spawn task to read stdout
    tokio::spawn(async move {
        let reader = BufReader::new(stdout);
        let mut lines = reader.lines();

        while let Ok(Some(line)) = lines.next_line().await {
            if !line.trim().is_empty() {
                let event = StreamEvent {
                    event_type: "stream".to_string(),
                    data: serde_json::from_str(&line).unwrap_or_else(|_| {
                        serde_json::json!({ "raw": line })
                    }),
                };
                let _ = app_clone.emit(&format!("claude-stream-{}", request_id_clone), &event);
            }
        }

        // Send completion event
        let done_event = StreamEvent {
            event_type: "done".to_string(),
            data: serde_json::json!({}),
        };
        let _ = app_clone.emit(&format!("claude-stream-{}", request_id_clone), &done_event);
    });

    CommandResult::ok(())
}

/// Invoke Claude CLI (non-streaming)
#[command]
pub async fn invoke_claude(
    prompt: String,
    options: Option<ClaudeOptions>,
) -> CommandResult<String> {
    let options = options.unwrap_or_default();

    let mut cmd = Command::new("claude");
    cmd.arg("-p").arg(&prompt);
    cmd.arg("--output-format").arg("json");

    if let Some(model) = &options.model {
        cmd.arg("--model").arg(model);
    }

    if options.continue_session {
        cmd.arg("--continue");
    } else if let Some(session_id) = &options.session_id {
        cmd.arg("--resume").arg(session_id);
    }

    if let Some(cwd) = &options.cwd {
        cmd.current_dir(cwd);
    }

    match cmd.output().await {
        Ok(output) => {
            if output.status.success() {
                let result = String::from_utf8_lossy(&output.stdout).to_string();
                CommandResult::ok(result)
            } else {
                let error = String::from_utf8_lossy(&output.stderr).to_string();
                CommandResult::err(error)
            }
        }
        Err(e) => CommandResult::err(format!("Failed to invoke Claude: {}", e)),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_claude_options_default() {
        let options = ClaudeOptions::default();
        assert!(options.model.is_none());
        assert!(options.session_id.is_none());
        assert!(!options.continue_session);
        assert!(options.cwd.is_none());
    }

    #[test]
    fn test_stream_event_serialize() {
        let event = StreamEvent {
            event_type: "stream".to_string(),
            data: serde_json::json!({"text": "hello"}),
        };
        
        let json = serde_json::to_string(&event).unwrap();
        assert!(json.contains("stream"));
        assert!(json.contains("hello"));
    }
}
