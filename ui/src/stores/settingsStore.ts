import { createSignal } from 'solid-js';
import { api } from '../tauri';
import type { GoogleCloudSettings } from '../types';

const DEFAULT_SETTINGS: GoogleCloudSettings = {
  projectId: '',
  location: 'us-central1',
};

const [settings, setSettings] = createSignal<GoogleCloudSettings>(DEFAULT_SETTINGS);
const [isSettingsLoaded, setIsSettingsLoaded] = createSignal(false);

let loadPromise: Promise<GoogleCloudSettings> | null = null;

const loadSettings = async () => {
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = api
    .settingsGet()
    .then((config) => {
      const nextSettings = {
        ...DEFAULT_SETTINGS,
        ...config.googleCloud,
      };
      setSettings(nextSettings);
      setIsSettingsLoaded(true);
      return nextSettings;
    })
    .catch((error) => {
      console.error('Error loading settings:', error);
      setSettings(DEFAULT_SETTINGS);
      setIsSettingsLoaded(true);
      return DEFAULT_SETTINGS;
    })
    .finally(() => {
      loadPromise = null;
    });

  return loadPromise;
};

const saveSettings = async (newSettings: GoogleCloudSettings) => {
  const config = await api.settingsUpdate(newSettings);
  setSettings(config.googleCloud);
  setIsSettingsLoaded(true);
  return config;
};

void loadSettings();

export { isSettingsLoaded, loadSettings, saveSettings, setSettings, settings };
