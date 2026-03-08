use crate::gcloud::{runner::CommandRunner, transcoder::TranscoderClient};
use crate::storage::config_store::{ConfigStore, ConfigStoreError};
use crate::types::{PaginatedJobsResponse, TranscoderJob};

#[derive(Debug, thiserror::Error)]
pub enum JobsError {
    #[error("{0}")]
    Message(String),
    #[error("config error: {0}")]
    Config(#[from] ConfigStoreError),
}

#[derive(Debug, Clone)]
pub struct JobsService<R: CommandRunner> {
    store: ConfigStore,
    client: TranscoderClient<R>,
}

impl<R: CommandRunner> JobsService<R> {
    pub fn new(store: ConfigStore, client: TranscoderClient<R>) -> Self {
        Self { store, client }
    }

    pub fn jobs_list(
        &self,
        page_size: u32,
        page_number: u32,
        search_term: Option<String>,
    ) -> Result<PaginatedJobsResponse, JobsError> {
        let settings = self.store.load_or_initialize_config()?.config.google_cloud;
        self.client
            .list_jobs(&settings, page_size, page_number, search_term)
            .map_err(|error| JobsError::Message(error.to_string()))
    }

    pub fn job_get(&self, job_id: String) -> Result<TranscoderJob, JobsError> {
        let settings = self.store.load_or_initialize_config()?.config.google_cloud;
        self.client
            .get_job(&settings, &job_id)
            .map_err(|error| JobsError::Message(error.to_string()))
    }
}
