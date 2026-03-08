use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use std::collections::BTreeMap;

pub const CURRENT_CONFIG_VERSION: u32 = 1;
pub const DEFAULT_LOCATION: &str = "us-central1";

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub version: u32,
    pub google_cloud: GoogleCloudSettings,
}

impl AppConfig {
    pub fn default_from_env() -> Self {
        Self {
            version: CURRENT_CONFIG_VERSION,
            google_cloud: GoogleCloudSettings {
                project_id: std::env::var("GOOGLE_CLOUD_PROJECT_ID").unwrap_or_default(),
                location: std::env::var("GOOGLE_CLOUD_LOCATION")
                    .unwrap_or_else(|_| DEFAULT_LOCATION.to_string()),
            },
        }
    }

    pub fn validate(&self) -> Result<(), ValidationError> {
        if self.version == 0 {
            return Err(ValidationError::InvalidVersion);
        }
        if self.google_cloud.location.trim().is_empty() {
            return Err(ValidationError::EmptyLocation);
        }
        Ok(())
    }
}

impl Default for AppConfig {
    fn default() -> Self {
        Self::default_from_env()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct GoogleCloudSettings {
    pub project_id: String,
    pub location: String,
}

impl Default for GoogleCloudSettings {
    fn default() -> Self {
        AppConfig::default_from_env().google_cloud
    }
}

#[derive(Debug, thiserror::Error)]
pub enum ValidationError {
    #[error("invalid config version")]
    InvalidVersion,
    #[error("google cloud location cannot be empty")]
    EmptyLocation,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct TranscoderJob {
    pub name: String,
    pub input_uri: Option<String>,
    pub output_uri: Option<String>,
    pub state: Option<String>,
    pub create_time: Option<String>,
    pub start_time: Option<String>,
    pub end_time: Option<String>,
    pub ttl_after_completion_days: Option<u32>,
    pub labels: BTreeMap<String, String>,
    pub error: Option<Value>,
    pub config: Value,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct JobTemplate {
    pub name: String,
    pub display_name: Option<String>,
    pub config: Value,
    pub labels: BTreeMap<String, String>,
    pub create_time: Option<String>,
    pub update_time: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct JobTemplateUpsertInput {
    pub name: String,
    pub display_name: Option<String>,
    pub config: Value,
    pub labels: BTreeMap<String, String>,
}

impl Default for JobTemplateUpsertInput {
    fn default() -> Self {
        Self {
            name: String::new(),
            display_name: None,
            config: Value::Object(Map::new()),
            labels: BTreeMap::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PaginatedJobsResponse {
    pub jobs: Vec<TranscoderJob>,
    pub next_page_token: Option<String>,
    pub total_size: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CreateJobInput {
    pub input_uri: String,
    pub output_uri: String,
    pub template_id: Option<String>,
    pub batch_mode_priority: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionTestResult {
    pub ok: bool,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct OpResult {
    pub ok: bool,
    pub message: String,
}
