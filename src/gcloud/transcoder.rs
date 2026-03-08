use crate::gcloud::runner::{CommandOutput, CommandRunner, RunnerError};
use crate::storage::config_store::ConfigStoreError;
use crate::types::{
    ConnectionTestResult, CreateJobInput, GoogleCloudSettings, JobTemplate, JobTemplateUpsertInput,
    OpResult, PaginatedJobsResponse, TranscoderJob,
};
use serde_json::Value;
use std::collections::BTreeMap;
use tempfile::NamedTempFile;

const MAX_JOBS_TO_FETCH: usize = 200;

#[derive(Debug, thiserror::Error)]
pub enum TranscoderError {
    #[error("{0}")]
    Message(String),
    #[error("config error: {0}")]
    Config(#[from] ConfigStoreError),
    #[error("json error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
}

#[derive(Debug, Clone)]
pub struct TranscoderClient<R: CommandRunner> {
    runner: R,
}

impl<R: CommandRunner> TranscoderClient<R> {
    pub fn new(runner: R) -> Self {
        Self { runner }
    }

    pub fn test_connection(
        &self,
        settings: &GoogleCloudSettings,
    ) -> Result<ConnectionTestResult, TranscoderError> {
        let auth = self.runner.run(
            "gcloud",
            &[
                "auth".into(),
                "list".into(),
                "--filter=status:ACTIVE".into(),
                "--format=value(account)".into(),
                "--limit=1".into(),
            ],
        );
        let auth = auth.map_err(|err| TranscoderError::Message(map_runner_error(err)))?;
        if auth.status_code != 0 {
            return Err(TranscoderError::Message(map_command_error(
                ErrorContext::ConnectionTest,
                &auth,
            )));
        }

        let account = auth.stdout.trim();
        if account.is_empty() {
            return Err(TranscoderError::Message(
                "No active gcloud authentication. Please run \"gcloud auth login\" or \"gcloud auth application-default login\"."
                    .to_string(),
            ));
        }

        let output = self.run_gcloud(
            &[
                "transcoder".into(),
                "jobs".into(),
                "list".into(),
                format!("--location={}", settings.location),
                format!("--project={}", settings.project_id),
                "--limit=1".into(),
                "--format=json".into(),
            ],
            ErrorContext::ConnectionTest,
        )?;

        let _ = parse_json_array(&output.stdout)?;
        Ok(ConnectionTestResult {
            ok: true,
            message: format!("Connected as {account}"),
        })
    }

    pub fn list_jobs(
        &self,
        settings: &GoogleCloudSettings,
        page_size: u32,
        page_number: u32,
        search_term: Option<String>,
    ) -> Result<PaginatedJobsResponse, TranscoderError> {
        let safe_page_size = page_size.max(1) as usize;
        let safe_page_number = page_number.max(1) as usize;
        let limit = (safe_page_size * safe_page_number).min(MAX_JOBS_TO_FETCH);

        let mut args = vec![
            "transcoder".into(),
            "jobs".into(),
            "list".into(),
            format!("--location={}", settings.location),
            format!("--project={}", settings.project_id),
            "--format=json".into(),
            "--sort-by=~createTime".into(),
            format!("--limit={limit}"),
        ];
        if let Some(term) = search_term
            .as_ref()
            .map(|value| value.trim())
            .filter(|value| !value.is_empty())
        {
            args.push(format!(
                "--filter=config.inputs.uri:{term} OR config.output.uri:{term}"
            ));
        }

        let output = self.run_gcloud(&args, ErrorContext::JobsList)?;
        if output.stderr.contains("Listed 0 items") || output.stdout.trim().is_empty() {
            return Ok(PaginatedJobsResponse {
                jobs: Vec::new(),
                next_page_token: None,
                total_size: Some(0),
            });
        }

        let all_jobs = parse_json_array(&output.stdout)?
            .into_iter()
            .map(|value| parse_job(&value))
            .collect::<Result<Vec<_>, _>>()?;

        let start = (safe_page_number - 1) * safe_page_size;
        let end = start.saturating_add(safe_page_size);
        let page_jobs = all_jobs
            .iter()
            .skip(start)
            .take(safe_page_size)
            .cloned()
            .collect::<Vec<_>>();

        let has_more = all_jobs.len() == limit && limit < MAX_JOBS_TO_FETCH || end < all_jobs.len();
        Ok(PaginatedJobsResponse {
            jobs: page_jobs,
            next_page_token: has_more.then(|| "has-more".to_string()),
            total_size: (!has_more).then_some(all_jobs.len()),
        })
    }

    pub fn get_job(
        &self,
        settings: &GoogleCloudSettings,
        job_id: &str,
    ) -> Result<TranscoderJob, TranscoderError> {
        let output = self.run_gcloud(
            &[
                "transcoder".into(),
                "jobs".into(),
                "describe".into(),
                job_id.to_string(),
                format!("--location={}", settings.location),
                format!("--project={}", settings.project_id),
                "--format=json".into(),
            ],
            ErrorContext::JobGet,
        )?;
        parse_job(&serde_json::from_str::<Value>(&output.stdout)?)
    }

    pub fn list_templates(
        &self,
        settings: &GoogleCloudSettings,
    ) -> Result<Vec<JobTemplate>, TranscoderError> {
        let output = self.run_gcloud(
            &[
                "transcoder".into(),
                "templates".into(),
                "list".into(),
                format!("--location={}", settings.location),
                format!("--project={}", settings.project_id),
                "--format=json".into(),
                "--limit=100".into(),
            ],
            ErrorContext::TemplatesList,
        )?;
        if output.stdout.trim().is_empty() {
            return Ok(Vec::new());
        }

        parse_json_array(&output.stdout)?
            .into_iter()
            .map(|value| parse_template(&value))
            .collect()
    }

    pub fn get_template(
        &self,
        settings: &GoogleCloudSettings,
        template_id: &str,
    ) -> Result<JobTemplate, TranscoderError> {
        let output = self.run_gcloud(
            &[
                "transcoder".into(),
                "templates".into(),
                "describe".into(),
                template_id.to_string(),
                format!("--location={}", settings.location),
                format!("--project={}", settings.project_id),
                "--format=json".into(),
            ],
            ErrorContext::TemplateGet,
        )?;
        parse_template(&serde_json::from_str::<Value>(&output.stdout)?)
    }

    pub fn create_template(
        &self,
        settings: &GoogleCloudSettings,
        input: &JobTemplateUpsertInput,
    ) -> Result<JobTemplate, TranscoderError> {
        let mut file = NamedTempFile::new()?;
        let payload = serde_json::json!({
            "config": input.config,
            "labels": if input.labels.is_empty() { Value::Null } else { serde_json::to_value(&input.labels)? }
        });
        serde_json::to_writer_pretty(file.as_file_mut(), &payload)?;

        let output = self.run_gcloud(
            &[
                "transcoder".into(),
                "templates".into(),
                "create".into(),
                input.name.clone(),
                format!("--location={}", settings.location),
                format!("--project={}", settings.project_id),
                format!("--file={}", file.path().display()),
                "--format=json".into(),
            ],
            ErrorContext::TemplateCreate,
        )?;

        parse_template(&serde_json::from_str::<Value>(&output.stdout)?)
    }

    pub fn update_template_replace(
        &self,
        settings: &GoogleCloudSettings,
        template_id: &str,
        input: &JobTemplateUpsertInput,
    ) -> Result<JobTemplate, TranscoderError> {
        self.delete_template(settings, template_id)?;
        let mut replacement = input.clone();
        replacement.name = template_id.to_string();
        self.create_template(settings, &replacement)
            .map_err(|error| {
                TranscoderError::Message(format!(
                    "Failed to update template (delete + recreate): {error}"
                ))
            })
    }

    pub fn delete_template(
        &self,
        settings: &GoogleCloudSettings,
        template_id: &str,
    ) -> Result<OpResult, TranscoderError> {
        self.run_gcloud(
            &[
                "transcoder".into(),
                "templates".into(),
                "delete".into(),
                template_id.to_string(),
                format!("--location={}", settings.location),
                format!("--project={}", settings.project_id),
                "--quiet".into(),
            ],
            ErrorContext::TemplateDelete,
        )?;

        Ok(OpResult {
            ok: true,
            message: "Template deleted successfully.".to_string(),
        })
    }

    pub fn create_job(
        &self,
        settings: &GoogleCloudSettings,
        input: &CreateJobInput,
    ) -> Result<TranscoderJob, TranscoderError> {
        let mut args = vec![
            "transcoder".into(),
            "jobs".into(),
            "create".into(),
            format!("--location={}", settings.location),
            format!("--project={}", settings.project_id),
            format!("--input-uri={}", input.input_uri),
            format!("--output-uri={}", input.output_uri),
            format!(
                "--template-id={}",
                input
                    .template_id
                    .clone()
                    .filter(|value| !value.trim().is_empty())
                    .unwrap_or_else(|| "preset/web-hd".to_string())
            ),
            "--format=json".into(),
        ];
        if let Some(priority) = input.batch_mode_priority {
            args.push(format!("--batch-mode-priority={priority}"));
        }

        let output = self.run_gcloud(&args, ErrorContext::JobCreate)?;
        let mut job = parse_job(&serde_json::from_str::<Value>(&output.stdout)?)?;
        if job.input_uri.is_none() {
            job.input_uri = Some(input.input_uri.clone());
        }
        if job.output_uri.is_none() {
            job.output_uri = Some(input.output_uri.clone());
        }
        Ok(job)
    }

    pub fn list_jobs_args(
        &self,
        settings: &GoogleCloudSettings,
        page_size: u32,
        page_number: u32,
        search_term: Option<String>,
    ) -> Vec<String> {
        let safe_page_size = page_size.max(1) as usize;
        let safe_page_number = page_number.max(1) as usize;
        let limit = (safe_page_size * safe_page_number).min(MAX_JOBS_TO_FETCH);
        let mut args = vec![
            "transcoder".into(),
            "jobs".into(),
            "list".into(),
            format!("--location={}", settings.location),
            format!("--project={}", settings.project_id),
            "--format=json".into(),
            "--sort-by=~createTime".into(),
            format!("--limit={limit}"),
        ];
        if let Some(term) = search_term
            .as_ref()
            .map(|value| value.trim())
            .filter(|value| !value.is_empty())
        {
            args.push(format!(
                "--filter=config.inputs.uri:{term} OR config.output.uri:{term}"
            ));
        }
        args
    }

    pub fn create_job_args(
        &self,
        settings: &GoogleCloudSettings,
        input: &CreateJobInput,
    ) -> Vec<String> {
        let mut args = vec![
            "transcoder".into(),
            "jobs".into(),
            "create".into(),
            format!("--location={}", settings.location),
            format!("--project={}", settings.project_id),
            format!("--input-uri={}", input.input_uri),
            format!("--output-uri={}", input.output_uri),
            format!(
                "--template-id={}",
                input
                    .template_id
                    .clone()
                    .filter(|value| !value.trim().is_empty())
                    .unwrap_or_else(|| "preset/web-hd".to_string())
            ),
            "--format=json".into(),
        ];
        if let Some(priority) = input.batch_mode_priority {
            args.push(format!("--batch-mode-priority={priority}"));
        }
        args
    }

    fn run_gcloud(
        &self,
        args: &[String],
        context: ErrorContext,
    ) -> Result<CommandOutput, TranscoderError> {
        let output = self
            .runner
            .run("gcloud", args)
            .map_err(|err| TranscoderError::Message(map_runner_error(err)))?;
        if output.status_code != 0 {
            return Err(TranscoderError::Message(map_command_error(
                context, &output,
            )));
        }
        Ok(output)
    }
}

#[derive(Debug, Clone, Copy)]
enum ErrorContext {
    JobsList,
    JobGet,
    ConnectionTest,
    TemplatesList,
    TemplateGet,
    TemplateCreate,
    TemplateDelete,
    JobCreate,
}

fn parse_json_array(stdout: &str) -> Result<Vec<Value>, TranscoderError> {
    Ok(serde_json::from_str::<Vec<Value>>(stdout)?)
}

fn parse_job(value: &Value) -> Result<TranscoderJob, TranscoderError> {
    Ok(TranscoderJob {
        name: value
            .get("name")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string(),
        input_uri: value
            .get("config")
            .and_then(|config| config.get("inputs"))
            .and_then(Value::as_array)
            .and_then(|inputs| inputs.first())
            .and_then(|input| input.get("uri"))
            .and_then(Value::as_str)
            .map(ToOwned::to_owned),
        output_uri: value
            .get("config")
            .and_then(|config| config.get("output"))
            .and_then(|output| output.get("uri"))
            .and_then(Value::as_str)
            .map(ToOwned::to_owned),
        state: value
            .get("state")
            .and_then(Value::as_str)
            .map(ToOwned::to_owned),
        create_time: value
            .get("createTime")
            .and_then(Value::as_str)
            .map(ToOwned::to_owned),
        start_time: value
            .get("startTime")
            .and_then(Value::as_str)
            .map(ToOwned::to_owned),
        end_time: value
            .get("endTime")
            .and_then(Value::as_str)
            .map(ToOwned::to_owned),
        ttl_after_completion_days: value
            .get("ttlAfterCompletionDays")
            .and_then(Value::as_u64)
            .map(|value| value as u32),
        labels: parse_labels(value.get("labels")),
        error: value.get("error").cloned(),
        config: value
            .get("config")
            .cloned()
            .unwrap_or_else(|| Value::Object(Default::default())),
    })
}

fn parse_template(value: &Value) -> Result<JobTemplate, TranscoderError> {
    Ok(JobTemplate {
        name: value
            .get("name")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string(),
        display_name: value
            .get("displayName")
            .and_then(Value::as_str)
            .map(ToOwned::to_owned),
        config: value
            .get("config")
            .cloned()
            .unwrap_or_else(|| Value::Object(Default::default())),
        labels: parse_labels(value.get("labels")),
        create_time: value
            .get("createTime")
            .and_then(Value::as_str)
            .map(ToOwned::to_owned),
        update_time: value
            .get("updateTime")
            .and_then(Value::as_str)
            .map(ToOwned::to_owned),
    })
}

fn parse_labels(value: Option<&Value>) -> BTreeMap<String, String> {
    value
        .and_then(Value::as_object)
        .map(|labels| {
            labels
                .iter()
                .filter_map(|(key, value)| {
                    value.as_str().map(|value| (key.clone(), value.to_string()))
                })
                .collect()
        })
        .unwrap_or_default()
}

fn map_runner_error(error: RunnerError) -> String {
    match error {
        RunnerError::NotFound => {
            "Google Cloud CLI (gcloud) not found. Please install the Google Cloud SDK.".to_string()
        }
        RunnerError::Io(message) => format!("CLI Error: {message}"),
    }
}

fn map_command_error(context: ErrorContext, output: &CommandOutput) -> String {
    let combined = if output.stderr.trim().is_empty() {
        output.stdout.trim()
    } else {
        output.stderr.trim()
    };

    if combined.contains("PERMISSION_DENIED") {
        return match context {
            ErrorContext::JobCreate => "Permission denied. Please check your Google Cloud credentials and bucket access.".to_string(),
            ErrorContext::ConnectionTest => "Permission denied. Please check that your credentials have access to the Transcoder API.".to_string(),
            _ => "Permission denied. Please check your Google Cloud credentials and API access.".to_string(),
        };
    }
    if combined.contains("API_DISABLED") {
        return "Transcoder API is not enabled. Please enable it in Google Cloud Console."
            .to_string();
    }
    if combined.contains("PROJECT_NOT_FOUND") {
        return "Project not found. Please check your Project ID.".to_string();
    }
    if combined.contains("LOCATION_NOT_FOUND") {
        return "Invalid location. Please check your region setting.".to_string();
    }
    if combined.contains("NOT_FOUND") {
        return match context {
            ErrorContext::JobGet => "Job not found. Please check the job ID.".to_string(),
            ErrorContext::TemplateGet | ErrorContext::TemplateDelete => {
                "Template not found. Please check the template ID.".to_string()
            }
            ErrorContext::JobCreate => {
                "Template or bucket not found. Please verify your template ID and bucket paths."
                    .to_string()
            }
            _ => format!("CLI Error: {combined}"),
        };
    }
    if combined.contains("ALREADY_EXISTS") {
        return match context {
            ErrorContext::TemplateCreate => {
                "Template with this name already exists. Please choose a different name."
                    .to_string()
            }
            ErrorContext::JobCreate => {
                "Job with this ID already exists. Please try again.".to_string()
            }
            _ => format!("CLI Error: {combined}"),
        };
    }
    if combined.contains("INVALID_ARGUMENT") {
        return match context {
            ErrorContext::TemplateCreate => {
                format!("Invalid template configuration:\n{combined}")
            }
            ErrorContext::JobCreate => {
                "Invalid job configuration. Please check your input/output URIs and template."
                    .to_string()
            }
            _ => "Invalid template configuration. Please check your settings.".to_string(),
        };
    }
    if combined.contains("FAILED_PRECONDITION") {
        return "Cannot delete template. It may be in use by active jobs.".to_string();
    }

    match context {
        ErrorContext::JobsList => format!("CLI Error: {combined}"),
        ErrorContext::JobGet => format!("CLI Error: {combined}"),
        ErrorContext::ConnectionTest => format!("CLI connection failed: {combined}"),
        ErrorContext::TemplatesList => format!("CLI Error: {combined}"),
        ErrorContext::TemplateGet => format!("CLI Error: {combined}"),
        ErrorContext::TemplateCreate => format!("CLI Error: {combined}"),
        ErrorContext::TemplateDelete => format!("CLI Error: {combined}"),
        ErrorContext::JobCreate => format!("CLI Error: {combined}"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::gcloud::runner::CommandOutput;
    use std::collections::VecDeque;
    use std::sync::{Arc, Mutex};

    #[derive(Clone, Default)]
    struct FakeRunner {
        outputs: Arc<Mutex<VecDeque<Result<CommandOutput, RunnerError>>>>,
        calls: Arc<Mutex<Vec<Vec<String>>>>,
    }

    impl FakeRunner {
        fn with_outputs(outputs: Vec<Result<CommandOutput, RunnerError>>) -> Self {
            Self {
                outputs: Arc::new(Mutex::new(outputs.into())),
                calls: Arc::new(Mutex::new(Vec::new())),
            }
        }

        fn calls(&self) -> Vec<Vec<String>> {
            self.calls.lock().expect("calls").clone()
        }
    }

    impl CommandRunner for FakeRunner {
        fn run(&self, program: &str, args: &[String]) -> Result<CommandOutput, RunnerError> {
            let mut call = vec![program.to_string()];
            call.extend(args.iter().cloned());
            self.calls.lock().expect("calls").push(call);
            self.outputs
                .lock()
                .expect("outputs")
                .pop_front()
                .expect("missing fake output")
        }
    }

    fn settings() -> GoogleCloudSettings {
        GoogleCloudSettings {
            project_id: "demo-project".into(),
            location: "us-central1".into(),
        }
    }

    fn ok(stdout: &str) -> Result<CommandOutput, RunnerError> {
        Ok(CommandOutput {
            stdout: stdout.into(),
            stderr: String::new(),
            status_code: 0,
        })
    }

    #[test]
    fn parses_jobs_list_and_sets_pagination() {
        let runner = FakeRunner::with_outputs(vec![ok(
            r#"[{"name":"projects/demo/locations/us-central1/jobs/job-1","state":"SUCCEEDED","createTime":"2026-01-01T00:00:00Z","config":{"inputs":[{"uri":"gs://in.mp4"}],"output":{"uri":"gs://out/"}}},{"name":"projects/demo/locations/us-central1/jobs/job-2","state":"RUNNING","config":{"inputs":[{"uri":"gs://in2.mp4"}],"output":{"uri":"gs://out2/"}}}]"#,
        )]);
        let client = TranscoderClient::new(runner);

        let result = client
            .list_jobs(&settings(), 1, 1, None)
            .expect("list jobs");

        assert_eq!(result.jobs.len(), 1);
        assert_eq!(result.jobs[0].input_uri.as_deref(), Some("gs://in.mp4"));
        assert_eq!(result.next_page_token.as_deref(), Some("has-more"));
    }

    #[test]
    fn builds_search_filter_args() {
        let client = TranscoderClient::new(FakeRunner::default());
        let args = client.list_jobs_args(&settings(), 50, 2, Some("needle".into()));
        assert!(args.iter().any(|arg| arg == "--limit=100"));
        assert!(
            args.iter()
                .any(|arg| arg == "--filter=config.inputs.uri:needle OR config.output.uri:needle")
        );
    }

    #[test]
    fn create_job_defaults_to_web_hd() {
        let client = TranscoderClient::new(FakeRunner::default());
        let args = client.create_job_args(
            &settings(),
            &CreateJobInput {
                input_uri: "gs://in.mp4".into(),
                output_uri: "gs://out/".into(),
                template_id: None,
                batch_mode_priority: Some(10),
            },
        );

        assert!(args.iter().any(|arg| arg == "--template-id=preset/web-hd"));
        assert!(args.iter().any(|arg| arg == "--batch-mode-priority=10"));
    }

    #[test]
    fn template_update_deletes_then_creates() {
        let runner = FakeRunner::with_outputs(vec![
            ok(""),
            ok(
                r#"{"name":"projects/demo/locations/us-central1/jobTemplates/template-1","config":{},"labels":{}}"#,
            ),
        ]);
        let client = TranscoderClient::new(runner.clone());
        let result = client
            .update_template_replace(
                &settings(),
                "template-1",
                &JobTemplateUpsertInput {
                    name: "template-1".into(),
                    display_name: None,
                    config: serde_json::json!({}),
                    labels: BTreeMap::new(),
                },
            )
            .expect("update template");

        assert!(result.name.ends_with("template-1"));
        let calls = runner.calls();
        assert_eq!(calls.len(), 2);
        assert_eq!(calls[0][2], "templates");
        assert_eq!(calls[0][3], "delete");
        assert_eq!(calls[1][2], "templates");
        assert_eq!(calls[1][3], "create");
    }

    #[test]
    fn maps_permission_error() {
        let output = CommandOutput {
            stdout: String::new(),
            stderr: "PERMISSION_DENIED: nope".into(),
            status_code: 1,
        };
        let message = map_command_error(ErrorContext::JobsList, &output);
        assert_eq!(
            message,
            "Permission denied. Please check your Google Cloud credentials and API access."
        );
    }
}
