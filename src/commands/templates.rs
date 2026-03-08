use crate::gcloud::{runner::CommandRunner, transcoder::TranscoderClient};
use crate::storage::config_store::{ConfigStore, ConfigStoreError};
use crate::types::{JobTemplate, JobTemplateUpsertInput, OpResult};

#[derive(Debug, thiserror::Error)]
pub enum TemplatesError {
    #[error("{0}")]
    Message(String),
    #[error("config error: {0}")]
    Config(#[from] ConfigStoreError),
}

#[derive(Debug, Clone)]
pub struct TemplatesService<R: CommandRunner> {
    store: ConfigStore,
    client: TranscoderClient<R>,
}

impl<R: CommandRunner> TemplatesService<R> {
    pub fn new(store: ConfigStore, client: TranscoderClient<R>) -> Self {
        Self { store, client }
    }

    pub fn templates_list(&self) -> Result<Vec<JobTemplate>, TemplatesError> {
        let settings = self.store.load_or_initialize_config()?.config.google_cloud;
        self.client
            .list_templates(&settings)
            .map_err(|error| TemplatesError::Message(error.to_string()))
    }

    pub fn template_get(&self, template_id: String) -> Result<JobTemplate, TemplatesError> {
        let settings = self.store.load_or_initialize_config()?.config.google_cloud;
        self.client
            .get_template(&settings, &template_id)
            .map_err(|error| TemplatesError::Message(error.to_string()))
    }

    pub fn template_create(
        &self,
        input: JobTemplateUpsertInput,
    ) -> Result<JobTemplate, TemplatesError> {
        let settings = self.store.load_or_initialize_config()?.config.google_cloud;
        self.client
            .create_template(&settings, &input)
            .map_err(|error| TemplatesError::Message(error.to_string()))
    }

    pub fn template_update_replace(
        &self,
        template_id: String,
        input: JobTemplateUpsertInput,
    ) -> Result<JobTemplate, TemplatesError> {
        let settings = self.store.load_or_initialize_config()?.config.google_cloud;
        self.client
            .update_template_replace(&settings, &template_id, &input)
            .map_err(|error| TemplatesError::Message(error.to_string()))
    }

    pub fn template_delete(&self, template_id: String) -> Result<OpResult, TemplatesError> {
        let settings = self.store.load_or_initialize_config()?.config.google_cloud;
        self.client
            .delete_template(&settings, &template_id)
            .map_err(|error| TemplatesError::Message(error.to_string()))
    }
}
