use std::env;
use std::path::{Path, PathBuf};
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
        let resolved_program = resolve_program(program);
        let output = Command::new(&resolved_program)
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

fn resolve_program(program: &str) -> PathBuf {
    if program != "gcloud" {
        return PathBuf::from(program);
    }

    resolve_gcloud_path().unwrap_or_else(|| PathBuf::from(program))
}

fn resolve_gcloud_path() -> Option<PathBuf> {
    env::var_os("GCLOUD_BIN")
        .map(PathBuf::from)
        .filter(|path| is_executable(path))
        .or_else(find_in_path)
        .or_else(common_gcloud_paths)
        .or_else(resolve_via_login_shell)
}

fn find_in_path() -> Option<PathBuf> {
    env::var_os("PATH").and_then(|path_var| {
        env::split_paths(&path_var)
            .map(|dir| dir.join("gcloud"))
            .find(|path| is_executable(path))
    })
}

fn common_gcloud_paths() -> Option<PathBuf> {
    let home = dirs::home_dir();
    [
        home.as_ref().map(|dir| dir.join(".gcloud/bin/gcloud")),
        home.as_ref()
            .map(|dir| dir.join("google-cloud-sdk/bin/gcloud")),
        Some(PathBuf::from(
            "/opt/homebrew/share/google-cloud-sdk/bin/gcloud",
        )),
        Some(PathBuf::from(
            "/usr/local/share/google-cloud-sdk/bin/gcloud",
        )),
        Some(PathBuf::from(
            "/opt/homebrew/Caskroom/google-cloud-sdk/latest/google-cloud-sdk/bin/gcloud",
        )),
        Some(PathBuf::from(
            "/usr/local/Caskroom/google-cloud-sdk/latest/google-cloud-sdk/bin/gcloud",
        )),
    ]
    .into_iter()
    .flatten()
    .find(|path| is_executable(path))
}

fn resolve_via_login_shell() -> Option<PathBuf> {
    let shell = env::var_os("SHELL")
        .map(PathBuf::from)
        .filter(|path| path.exists())
        .unwrap_or_else(|| PathBuf::from("/bin/zsh"));

    let output = Command::new(shell)
        .args(["-lc", "command -v gcloud"])
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
    (!path.is_empty())
        .then(|| PathBuf::from(path))
        .filter(|candidate| is_executable(candidate))
}

fn is_executable(path: &Path) -> bool {
    path.is_file()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn leaves_non_gcloud_programs_untouched() {
        assert_eq!(resolve_program("echo"), PathBuf::from("echo"));
    }

    #[test]
    fn uses_gcloud_bin_env_override_when_present() {
        let temp = tempfile::NamedTempFile::new().expect("temp file");
        let temp_path = temp.path().to_path_buf();
        unsafe { env::set_var("GCLOUD_BIN", &temp_path) };

        let resolved = resolve_gcloud_path();

        unsafe { env::remove_var("GCLOUD_BIN") };
        assert_eq!(resolved, Some(temp_path));
    }

    #[test]
    fn filters_missing_gcloud_bin_override() {
        unsafe { env::set_var("GCLOUD_BIN", "/tmp/definitely-missing-gcloud") };

        let resolved = resolve_gcloud_path();

        unsafe { env::remove_var("GCLOUD_BIN") };
        assert_ne!(resolved, Some(PathBuf::from("/tmp/definitely-missing-gcloud")));
    }
}
