use std::process::Command;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CommandOutput {
    pub stdout: String,
    pub stderr: String,
    pub status_code: i32,
}

#[derive(Debug, thiserror::Error, Clone, PartialEq, Eq)]
pub enum RunnerError {
    #[error("command not found")]
    NotFound,
    #[error("failed to run command: {0}")]
    Io(String),
}

pub trait CommandRunner: Clone + Send + Sync + 'static {
    fn run(&self, program: &str, args: &[String]) -> Result<CommandOutput, RunnerError>;
}

#[derive(Debug, Clone, Default)]
pub struct StdCommandRunner;

impl CommandRunner for StdCommandRunner {
    fn run(&self, program: &str, args: &[String]) -> Result<CommandOutput, RunnerError> {
        let output =
            Command::new(program)
                .args(args)
                .output()
                .map_err(|error| match error.kind() {
                    std::io::ErrorKind::NotFound => RunnerError::NotFound,
                    _ => RunnerError::Io(error.to_string()),
                })?;

        Ok(CommandOutput {
            stdout: String::from_utf8_lossy(&output.stdout).into_owned(),
            stderr: String::from_utf8_lossy(&output.stderr).into_owned(),
            status_code: output.status.code().unwrap_or(1),
        })
    }
}
