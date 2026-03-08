#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::State;
use transcoder_api_core::commands::jobs::JobsService;
use transcoder_api_core::commands::process::ProcessService;
use transcoder_api_core::commands::settings::SettingsService;
use transcoder_api_core::commands::templates::TemplatesService;
use transcoder_api_core::gcloud::runner::StdCommandRunner;
use transcoder_api_core::gcloud::transcoder::TranscoderClient;
use transcoder_api_core::storage::config_store::ConfigStore;
use transcoder_api_core::types::{
    AppConfig, ConnectionTestResult, CreateJobInput, GoogleCloudSettings, JobTemplate,
    JobTemplateUpsertInput, OpResult, PaginatedJobsResponse, TranscoderJob,
};

#[derive(Clone)]
struct AppState {
    settings: SettingsService<StdCommandRunner>,
    jobs: JobsService<StdCommandRunner>,
    templates: TemplatesService<StdCommandRunner>,
    process: ProcessService<StdCommandRunner>,
}

impl AppState {
    fn new() -> Self {
        let store = ConfigStore::new(ConfigStore::default_app_dir());
        let runner = StdCommandRunner;
        let client = TranscoderClient::new(runner.clone());

        Self {
            settings: SettingsService::new(store.clone(), client.clone()),
            jobs: JobsService::new(store.clone(), client.clone()),
            templates: TemplatesService::new(store.clone(), client.clone()),
            process: ProcessService::new(store, client),
        }
    }
}

#[tauri::command]
async fn settings_get(state: State<'_, AppState>) -> Result<AppConfig, String> {
    let service = state.settings.clone();
    tauri::async_runtime::spawn_blocking(move || service.settings_get())
        .await
        .map_err(|error| error.to_string())?
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn settings_update(
    settings: GoogleCloudSettings,
    state: State<'_, AppState>,
) -> Result<AppConfig, String> {
    let service = state.settings.clone();
    tauri::async_runtime::spawn_blocking(move || service.settings_update(settings))
        .await
        .map_err(|error| error.to_string())?
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn settings_test_connection(
    candidate: GoogleCloudSettings,
    state: State<'_, AppState>,
) -> Result<ConnectionTestResult, String> {
    let service = state.settings.clone();
    tauri::async_runtime::spawn_blocking(move || service.settings_test_connection(candidate))
        .await
        .map_err(|error| error.to_string())?
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn jobs_list(
    page_size: u32,
    page_number: u32,
    search_term: Option<String>,
    state: State<'_, AppState>,
) -> Result<PaginatedJobsResponse, String> {
    let service = state.jobs.clone();
    tauri::async_runtime::spawn_blocking(move || {
        service.jobs_list(page_size, page_number, search_term)
    })
    .await
    .map_err(|error| error.to_string())?
    .map_err(|error| error.to_string())
}

#[tauri::command]
async fn job_get(job_id: String, state: State<'_, AppState>) -> Result<TranscoderJob, String> {
    let service = state.jobs.clone();
    tauri::async_runtime::spawn_blocking(move || service.job_get(job_id))
        .await
        .map_err(|error| error.to_string())?
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn templates_list(state: State<'_, AppState>) -> Result<Vec<JobTemplate>, String> {
    let service = state.templates.clone();
    tauri::async_runtime::spawn_blocking(move || service.templates_list())
        .await
        .map_err(|error| error.to_string())?
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn template_get(
    template_id: String,
    state: State<'_, AppState>,
) -> Result<JobTemplate, String> {
    let service = state.templates.clone();
    tauri::async_runtime::spawn_blocking(move || service.template_get(template_id))
        .await
        .map_err(|error| error.to_string())?
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn template_create(
    input: JobTemplateUpsertInput,
    state: State<'_, AppState>,
) -> Result<JobTemplate, String> {
    let service = state.templates.clone();
    tauri::async_runtime::spawn_blocking(move || service.template_create(input))
        .await
        .map_err(|error| error.to_string())?
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn template_update_replace(
    template_id: String,
    input: JobTemplateUpsertInput,
    state: State<'_, AppState>,
) -> Result<JobTemplate, String> {
    let service = state.templates.clone();
    tauri::async_runtime::spawn_blocking(move || {
        service.template_update_replace(template_id, input)
    })
    .await
    .map_err(|error| error.to_string())?
    .map_err(|error| error.to_string())
}

#[tauri::command]
async fn template_delete(
    template_id: String,
    state: State<'_, AppState>,
) -> Result<OpResult, String> {
    let service = state.templates.clone();
    tauri::async_runtime::spawn_blocking(move || service.template_delete(template_id))
        .await
        .map_err(|error| error.to_string())?
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn job_create(
    input: CreateJobInput,
    state: State<'_, AppState>,
) -> Result<TranscoderJob, String> {
    let service = state.process.clone();
    tauri::async_runtime::spawn_blocking(move || service.job_create(input))
        .await
        .map_err(|error| error.to_string())?
        .map_err(|error| error.to_string())
}

fn main() {
    tauri::Builder::default()
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            settings_get,
            settings_update,
            settings_test_connection,
            jobs_list,
            job_get,
            templates_list,
            template_get,
            template_create,
            template_update_replace,
            template_delete,
            job_create
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
