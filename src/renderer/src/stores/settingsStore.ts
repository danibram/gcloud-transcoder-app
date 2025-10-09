import { createEffect, createSignal } from 'solid-js';

export interface GoogleCloudSettings {
    projectId: string;
    location: string;
}

const DEFAULT_SETTINGS: GoogleCloudSettings = {
    projectId: '',
    location: 'us-central1',
};

// Create reactive signals for settings
const [settings, setSettings] = createSignal<GoogleCloudSettings>(DEFAULT_SETTINGS);
const [isSettingsLoaded, setIsSettingsLoaded] = createSignal(false);

// Load settings from localStorage on initialization
const loadSettings = () => {
    try {
        const savedSettings = localStorage.getItem('googleCloudSettings');
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        }
        setIsSettingsLoaded(true);
    } catch (error) {
        console.error('Error loading settings:', error);
        setIsSettingsLoaded(true);
    }
};

// Save settings to localStorage
const saveSettings = (newSettings: Partial<GoogleCloudSettings>) => {
    const updatedSettings = { ...settings(), ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('googleCloudSettings', JSON.stringify(updatedSettings));

    // Notify main process about settings change
    window.electronAPI?.updateSettings?.(updatedSettings);
};

// Auto-save effect
createEffect(() => {
    if (isSettingsLoaded()) {
        const currentSettings = settings();
        localStorage.setItem('googleCloudSettings', JSON.stringify(currentSettings));
    }
});

// Initialize settings on module load
loadSettings();

export {
    isSettingsLoaded, loadSettings, saveSettings, setSettings, settings
};

