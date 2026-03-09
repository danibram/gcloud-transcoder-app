use crate::types::{AppConfig, CURRENT_CONFIG_VERSION, ValidationError};
use chrono::Utc;
use std::fs::{self, File};
use std::io::Write;
use std::path::{Path, PathBuf};

const APP_DIR_NAME: &str = "gcloud-transcoder-app";
const LEGACY_APP_DIR_NAME: &str = "transcoder-api-dashboard";

#[derive(Debug, thiserror::Error)]
pub enum ConfigStoreError {
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("json error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("validation error: {0}")]
    Validation(#[from] ValidationError),
}

#[derive(Debug, Clone)]
pub struct LoadConfigResult {
    pub config: AppConfig,
    pub config_recovered: bool,
    pub config_migrated: bool,
}

#[derive(Debug, Clone)]
pub struct ConfigStore {
    config_dir: PathBuf,
    config_path: PathBuf,
}

impl ConfigStore {
    pub fn new(config_dir: impl AsRef<Path>) -> Self {
        let config_dir = config_dir.as_ref().to_path_buf();
        let config_path = config_dir.join("config.json");
        Self {
            config_dir,
            config_path,
        }
    }

    pub fn default_app_dir() -> PathBuf {
        dirs::config_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join(APP_DIR_NAME)
    }

    pub fn config_path(&self) -> &Path {
        &self.config_path
    }

    pub fn load_or_initialize_config(&self) -> Result<LoadConfigResult, ConfigStoreError> {
        self.migrate_legacy_default_dir()?;
        fs::create_dir_all(&self.config_dir)?;

        if !self.config_path.exists() {
            let cfg = AppConfig::default_from_env();
            self.save_config_atomic(&cfg)?;
            return Ok(LoadConfigResult {
                config: cfg,
                config_recovered: false,
                config_migrated: false,
            });
        }

        match fs::read_to_string(&self.config_path) {
            Ok(raw) => match serde_json::from_str::<AppConfig>(&raw) {
                Ok(cfg) => self.handle_versioning(cfg),
                Err(_) => self.handle_corrupt_json(),
            },
            Err(_) => self.handle_corrupt_json(),
        }
    }

    pub fn save_config_atomic(&self, config: &AppConfig) -> Result<(), ConfigStoreError> {
        config.validate()?;
        fs::create_dir_all(&self.config_dir)?;

        let tmp_path = self.config_dir.join("config.json.tmp");
        let bytes = serde_json::to_vec_pretty(config)?;
        let mut file = File::create(&tmp_path)?;
        file.write_all(&bytes)?;
        file.sync_all()?;

        fs::rename(&tmp_path, &self.config_path)?;

        #[cfg(unix)]
        {
            let dir = File::open(&self.config_dir)?;
            dir.sync_all()?;
        }

        Ok(())
    }

    pub fn backup_current_config(&self) -> Result<(), ConfigStoreError> {
        if self.config_path.exists() {
            fs::copy(&self.config_path, self.config_dir.join("config.json.bak"))?;
        }
        Ok(())
    }

    fn handle_versioning(&self, mut cfg: AppConfig) -> Result<LoadConfigResult, ConfigStoreError> {
        let mut migrated = false;
        if cfg.version < CURRENT_CONFIG_VERSION {
            self.backup_current_config()?;
            cfg.version = CURRENT_CONFIG_VERSION;
            self.save_config_atomic(&cfg)?;
            migrated = true;
        }

        cfg.validate()?;

        Ok(LoadConfigResult {
            config: cfg,
            config_recovered: false,
            config_migrated: migrated,
        })
    }

    fn handle_corrupt_json(&self) -> Result<LoadConfigResult, ConfigStoreError> {
        if self.config_path.exists() {
            let ts = Utc::now().format("%Y%m%d%H%M%S");
            fs::rename(
                &self.config_path,
                self.config_dir.join(format!("config.corrupt.{ts}.json")),
            )?;
        }

        let cfg = AppConfig::default_from_env();
        self.save_config_atomic(&cfg)?;

        Ok(LoadConfigResult {
            config: cfg,
            config_recovered: true,
            config_migrated: false,
        })
    }

    fn migrate_legacy_default_dir(&self) -> Result<(), ConfigStoreError> {
        let is_named_after_new_app_dir = self
            .config_dir
            .file_name()
            .and_then(|name| name.to_str())
            == Some(APP_DIR_NAME);

        if !is_named_after_new_app_dir || self.config_path.exists() {
            return Ok(());
        }

        let legacy_dir = self.config_dir.with_file_name(LEGACY_APP_DIR_NAME);

        if !legacy_dir.exists() {
            return Ok(());
        }

        if let Some(parent) = self.config_dir.parent() {
            fs::create_dir_all(parent)?;
        }

        fs::rename(legacy_dir, &self.config_dir)?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn seeds_defaults_from_env() {
        unsafe {
            std::env::set_var("GOOGLE_CLOUD_PROJECT_ID", "demo-project");
            std::env::set_var("GOOGLE_CLOUD_LOCATION", "europe-west1");
        }

        let cfg = AppConfig::default_from_env();
        assert_eq!(cfg.google_cloud.project_id, "demo-project");
        assert_eq!(cfg.google_cloud.location, "europe-west1");

        unsafe {
            std::env::remove_var("GOOGLE_CLOUD_PROJECT_ID");
            std::env::remove_var("GOOGLE_CLOUD_LOCATION");
        }
    }

    #[test]
    fn recovers_corrupt_config() {
        let dir = tempdir().expect("tempdir");
        let store = ConfigStore::new(dir.path());
        fs::write(store.config_path(), "{broken").expect("write corrupt");

        let loaded = store.load_or_initialize_config().expect("load config");
        assert!(loaded.config_recovered);
        assert!(store.config_path().exists());

        let entries = fs::read_dir(dir.path())
            .expect("read dir")
            .filter_map(Result::ok)
            .map(|entry| entry.file_name().to_string_lossy().into_owned())
            .collect::<Vec<_>>();
        assert!(
            entries
                .iter()
                .any(|name| name.starts_with("config.corrupt."))
        );
    }

    #[test]
    fn migrates_old_config_and_writes_backup() {
        let dir = tempdir().expect("tempdir");
        let store = ConfigStore::new(dir.path());
        let old = serde_json::json!({
            "version": 0,
            "googleCloud": {
                "projectId": "legacy-project",
                "location": "us-central1"
            }
        });
        fs::write(
            store.config_path(),
            serde_json::to_vec_pretty(&old).expect("serialize old"),
        )
        .expect("write old");

        let loaded = store.load_or_initialize_config().expect("load migrated");
        assert!(loaded.config_migrated);
        assert_eq!(loaded.config.version, CURRENT_CONFIG_VERSION);
        assert!(dir.path().join("config.json.bak").exists());
    }

    #[test]
    fn migrates_legacy_default_directory_when_new_path_is_empty() {
        let root = tempdir().expect("tempdir");
        let legacy_dir = root.path().join(LEGACY_APP_DIR_NAME);
        let new_dir = root.path().join(APP_DIR_NAME);
        fs::create_dir_all(&legacy_dir).expect("create legacy dir");
        fs::write(
            legacy_dir.join("config.json"),
            serde_json::to_vec_pretty(&AppConfig::default()).expect("serialize config"),
        )
        .expect("write legacy config");

        let store = ConfigStore::new(&new_dir);
        store
            .migrate_legacy_default_dir()
            .expect("migrate legacy dir");

        assert!(new_dir.join("config.json").exists());
        assert!(!legacy_dir.exists());
    }
}
