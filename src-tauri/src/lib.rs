mod commands;
mod pty;

use commands::{claude, config, fs, git};
use pty::{
    create_pty_session, write_to_pty, resize_pty, 
    close_pty_session, list_pty_sessions, create_claude_pty
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            claude::get_claude_version,
            claude::invoke_claude,
            claude::invoke_claude_stream,
            config::read_config_file,
            config::write_config_file,
            config::list_commands,
            config::list_agents,
            config::list_skills,
            // PTY commands
            create_pty_session,
            write_to_pty,
            resize_pty,
            close_pty_session,
            list_pty_sessions,
            create_claude_pty,
            // File system commands
            fs::list_directory,
            fs::read_file_content,
            fs::get_file_info,
            // Git commands
            git::get_git_status,
            git::get_git_branch,
            git::list_git_branches,
            git::get_git_log,
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_app_initialization() {
        // Basic test to ensure the module compiles
        assert!(true);
    }
}
