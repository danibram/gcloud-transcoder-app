use crate::gcloud::{runner::CommandRunner, transcoder::TranscoderClient};
use crate::storage::config_store::{ConfigStore, ConfigStoreError};
use crate::types::{AppConfig, ConnectionTestResult, GoogleCloudSettings};

#[derive(Debug, thiserror::Error)]
pub enum SettingsError {
    #[error("{0}")]
    Message(String),
    #[error("config error: {0}")]
    Config(#[from] ConfigStoreError),
}

#[derive(Debug, Clone)]
pub struct SettingsService<R: CommandRunner> {
    store: ConfigStore,
    client: TranscoderClient<R>,
}

impl<R: CommandRunner> SettingsService<R> {
    pub fn new(store: ConfigStore, client: TranscoderClient<R>) -> Self {
        Self { store, client }
    }

    pub fn settings_get(&self) -> Result<AppConfig, SettingsError> {
        Ok(self.store.load_or_initialize_config()?.config)
    }

    pub fn settings_update(
        &self,
        settings: GoogleCloudSettings,
    ) -> Result<AppConfig, SettingsError> {
        let mut config = self.store.load_or_initialize_config()?.config;
        config.google_cloud = settings;
        self.store.save_config_atomic(&config)?;
        Ok(config)
    }

    pub fn settings_test_connection(
        &self,
        candidate: GoogleCloudSettings,
    ) -> Result<ConnectionTestResult, SettingsError> {
        self.client
            .test_connection(&candidate)
            .map_err(|error| SettingsError::Message(error.to_string()))
    }
}
