use crate::gcloud::{runner::CommandRunner, transcoder::TranscoderClient};
use crate::storage::config_store::{ConfigStore, ConfigStoreError};
use crate::types::{CreateJobInput, TranscoderJob};

#[derive(Debug, thiserror::Error)]
pub enum ProcessError {
    #[error("{0}")]
    Message(String),
    #[error("config error: {0}")]
    Config(#[from] ConfigStoreError),
}

#[derive(Debug, Clone)]
pub struct ProcessService<R: CommandRunner> {
    store: ConfigStore,
    client: TranscoderClient<R>,
}

impl<R: CommandRunner> ProcessService<R> {
    pub fn new(store: ConfigStore, client: TranscoderClient<R>) -> Self {
        Self { store, client }
    }

    pub fn job_create(&self, input: CreateJobInput) -> Result<TranscoderJob, ProcessError> {
        let settings = self.store.load_or_initialize_config()?.config.google_cloud;
        self.client
            .create_job(&settings, &input)
            .map_err(|error| ProcessError::Message(error.to_string()))
    }
}
