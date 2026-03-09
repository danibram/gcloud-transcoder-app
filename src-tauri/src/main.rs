#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::State;
use tauri_plugin_updater::Builder as UpdaterBuilder;
use tauri_plugin_updater::UpdaterExt;
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

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct AppUpdateSummary {
    current_version: String,
    version: String,
    date: Option<String>,
    body: Option<String>,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct AppUpdateCheckResponse {
    configured: bool,
    update: Option<AppUpdateSummary>,
}

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

#[tauri::command]
async fn app_update_check(app: tauri::AppHandle) -> Result<AppUpdateCheckResponse, String> {
    match checked_update(&app).await? {
        UpdateCheck::NotConfigured => Ok(AppUpdateCheckResponse {
            configured: false,
            update: None,
        }),
        UpdateCheck::NoUpdate => Ok(AppUpdateCheckResponse {
            configured: true,
            update: None,
        }),
        UpdateCheck::Available(update) => Ok(AppUpdateCheckResponse {
            configured: true,
            update: Some(AppUpdateSummary {
                current_version: update.current_version,
                version: update.version,
                date: update.date.map(|date| date.to_string()),
                body: update.body,
            }),
        }),
    }
}

#[tauri::command]
async fn app_update_install(app: tauri::AppHandle) -> Result<(), String> {
    let update = match checked_update(&app).await? {
        UpdateCheck::Available(update) => update,
        UpdateCheck::NotConfigured => {
            return Err("Auto-update is not configured for this build".into());
        }
        UpdateCheck::NoUpdate => {
            return Err("No update is currently available".into());
        }
    };

    update
        .download_and_install(|_, _| {}, || {})
        .await
        .map_err(|error| error.to_string())
}

enum UpdateCheck {
    NotConfigured,
    NoUpdate,
    Available(tauri_plugin_updater::Update),
}

async fn checked_update(app: &tauri::AppHandle) -> Result<UpdateCheck, String> {
    let updater = match app.updater() {
        Ok(updater) => updater,
        Err(error) => {
            let message = error.to_string();
            if message.contains("Updater does not have any endpoints set")
                || message.contains("missing field `pubkey`")
                || message.contains("missing field `endpoints`")
            {
                return Ok(UpdateCheck::NotConfigured);
            }

            return Err(message);
        }
    };

    updater
        .check()
        .await
        .map(|update| match update {
            Some(update) => UpdateCheck::Available(update),
            None => UpdateCheck::NoUpdate,
        })
        .map_err(|error| error.to_string())
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            app.handle().plugin(tauri_plugin_process::init())?;
            app.handle().plugin(UpdaterBuilder::new().build())?;
            Ok(())
        })
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
            job_create,
            app_update_check,
            app_update_install
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
