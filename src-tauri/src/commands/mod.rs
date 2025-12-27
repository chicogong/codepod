pub mod claude;

use serde::{Deserialize, Serialize};

/// Unified command result wrapper
#[derive(Debug, Serialize, Deserialize)]
pub struct CommandResult<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T> CommandResult<T> {
    pub fn ok(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn err(error: impl ToString) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(error.to_string()),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_command_result_ok() {
        let result: CommandResult<String> = CommandResult::ok("test".to_string());
        assert!(result.success);
        assert_eq!(result.data, Some("test".to_string()));
        assert!(result.error.is_none());
    }

    #[test]
    fn test_command_result_err() {
        let result: CommandResult<String> = CommandResult::err("error message");
        assert!(!result.success);
        assert!(result.data.is_none());
        assert_eq!(result.error, Some("error message".to_string()));
    }
}
