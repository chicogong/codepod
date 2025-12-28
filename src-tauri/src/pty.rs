//! PTY (Pseudo Terminal) management module
//! 
//! Manages terminal sessions for running Claude CLI in interactive mode.

use parking_lot::Mutex;
use portable_pty::{native_pty_system, CommandBuilder, PtyPair, PtySize};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::Arc;
use std::thread;
use tauri::{command, AppHandle, Emitter};
use uuid::Uuid;

/// Terminal session data
struct PtySession {
    pair: PtyPair,
    writer: Box<dyn Write + Send>,
}

/// Global PTY session manager
lazy_static::lazy_static! {
    static ref PTY_SESSIONS: Arc<Mutex<HashMap<String, PtySession>>> = 
        Arc::new(Mutex::new(HashMap::new()));
}

/// PTY output event sent to frontend
#[derive(Clone, serde::Serialize)]
pub struct PtyOutput {
    pub session_id: String,
    pub data: String,
}

/// PTY exit event sent to frontend
#[derive(Clone, serde::Serialize)]
pub struct PtyExit {
    pub session_id: String,
    pub exit_code: Option<i32>,
}

/// Create a new PTY session
#[command]
pub async fn create_pty_session(
    app: AppHandle,
    cwd: Option<String>,
    command: Option<String>,
    args: Option<Vec<String>>,
    cols: Option<u16>,
    rows: Option<u16>,
) -> Result<String, String> {
    let session_id = Uuid::new_v4().to_string();
    
    // Create PTY system
    let pty_system = native_pty_system();
    
    // Create PTY pair with specified size
    let pair = pty_system
        .openpty(PtySize {
            rows: rows.unwrap_or(24),
            cols: cols.unwrap_or(80),
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| format!("Failed to create PTY: {}", e))?;

    // Build command
    let cmd_str = command.as_deref().unwrap_or("claude");
    let mut cmd = CommandBuilder::new(cmd_str);
    
    // Add arguments
    if let Some(ref args_vec) = args {
        for arg in args_vec {
            cmd.arg(arg);
        }
    }
    
    // Set working directory
    if let Some(ref dir) = cwd {
        cmd.cwd(dir);
    }
    
    // Set environment for interactive mode
    cmd.env("TERM", "xterm-256color");
    cmd.env("COLORTERM", "truecolor");
    
    // Spawn the command
    let mut child = pair.slave
        .spawn_command(cmd)
        .map_err(|e| format!("Failed to spawn command: {}", e))?;
    
    // Get writer for input
    let writer = pair.master
        .take_writer()
        .map_err(|e| format!("Failed to get PTY writer: {}", e))?;
    
    // Get reader for output
    let mut reader = pair.master
        .try_clone_reader()
        .map_err(|e| format!("Failed to get PTY reader: {}", e))?;
    
    // Store session
    {
        let mut sessions = PTY_SESSIONS.lock();
        sessions.insert(session_id.clone(), PtySession {
            pair,
            writer,
        });
    }
    
    // Spawn thread to read output and emit events
    let app_clone = app.clone();
    let session_id_clone = session_id.clone();
    
    thread::spawn(move || {
        let mut buffer = [0u8; 4096];
        
        loop {
            match reader.read(&mut buffer) {
                Ok(0) => break, // EOF
                Ok(n) => {
                    // Convert to string (lossy for invalid UTF-8)
                    let data = String::from_utf8_lossy(&buffer[..n]).to_string();
                    
                    // Emit output event
                    let _ = app_clone.emit("pty-output", PtyOutput {
                        session_id: session_id_clone.clone(),
                        data,
                    });
                }
                Err(e) => {
                    log::error!("PTY read error: {}", e);
                    break;
                }
            }
        }
        
        // Wait for process to exit
        let exit_code = child.wait().ok().map(|status| {
            status.exit_code() as i32
        });
        
        // Emit exit event
        let _ = app_clone.emit("pty-exit", PtyExit {
            session_id: session_id_clone.clone(),
            exit_code,
        });
        
        // Clean up session
        let mut sessions = PTY_SESSIONS.lock();
        sessions.remove(&session_id_clone);
    });
    
    Ok(session_id)
}

/// Write input to a PTY session
#[command]
pub async fn write_to_pty(
    session_id: String,
    data: String,
) -> Result<(), String> {
    let mut sessions = PTY_SESSIONS.lock();
    
    if let Some(session) = sessions.get_mut(&session_id) {
        session.writer
            .write_all(data.as_bytes())
            .map_err(|e| format!("Failed to write to PTY: {}", e))?;
        session.writer
            .flush()
            .map_err(|e| format!("Failed to flush PTY: {}", e))?;
        Ok(())
    } else {
        Err(format!("Session not found: {}", session_id))
    }
}

/// Resize a PTY session
#[command]
pub async fn resize_pty(
    session_id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let sessions = PTY_SESSIONS.lock();
    
    if let Some(session) = sessions.get(&session_id) {
        session.pair.master
            .resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| format!("Failed to resize PTY: {}", e))?;
        Ok(())
    } else {
        Err(format!("Session not found: {}", session_id))
    }
}

/// Close a PTY session
#[command]
pub async fn close_pty_session(
    session_id: String,
) -> Result<(), String> {
    let mut sessions = PTY_SESSIONS.lock();
    
    if sessions.remove(&session_id).is_some() {
        Ok(())
    } else {
        Err(format!("Session not found: {}", session_id))
    }
}

/// List all active PTY sessions
#[command]
pub async fn list_pty_sessions() -> Vec<String> {
    let sessions = PTY_SESSIONS.lock();
    sessions.keys().cloned().collect()
}

/// Create a Claude session with PTY
#[command]
pub async fn create_claude_pty(
    app: AppHandle,
    cwd: Option<String>,
    resume_session: Option<String>,
    cols: Option<u16>,
    rows: Option<u16>,
) -> Result<String, String> {
    let mut args = Vec::new();
    
    // Add resume flag if session ID provided
    if let Some(ref session) = resume_session {
        args.push("--resume".to_string());
        args.push(session.clone());
    }
    
    // Create PTY session with claude command
    create_pty_session(
        app,
        cwd,
        Some("claude".to_string()),
        if args.is_empty() { None } else { Some(args) },
        cols,
        rows,
    ).await
}
