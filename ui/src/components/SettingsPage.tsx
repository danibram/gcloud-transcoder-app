import { Component, createEffect, createSignal, Show } from 'solid-js';
import { saveSettings, settings } from '../stores/settingsStore';
import { AlertCircleIcon, CheckIcon, SaveIcon } from './Icons';
import { api } from '../tauri';
import type { GoogleCloudSettings } from '../types';

interface SettingsPageProps {
    onBack: () => void;
}

const SettingsPage: Component<SettingsPageProps> = (props) => {
    const [localSettings, setLocalSettings] = createSignal(settings());
    const [isSaving, setIsSaving] = createSignal(false);
    const [saveStatus, setSaveStatus] = createSignal<'idle' | 'success' | 'error'>('idle');
    const [validationErrors, setValidationErrors] = createSignal<string[]>([]);

    createEffect(() => {
        setLocalSettings(settings());
    });

    const validateSettings = () => {
        const errors: string[] = [];
        const current = localSettings();

        if (!current.projectId.trim()) {
            errors.push('Project ID is required');
        }

        if (!current.location.trim()) {
            errors.push('Location is required');
        }

        setValidationErrors(errors);
        return errors.length === 0;
    };

    const handleSave = async () => {
        if (!validateSettings()) {
            setSaveStatus('error');
            return;
        }

        setIsSaving(true);
        setSaveStatus('idle');

        try {
            // Test the connection with new settings
            const testResult = await api.settingsTestConnection(localSettings());

            if (testResult.ok) {
                await saveSettings(localSettings());
                setSaveStatus('success');
                setTimeout(() => setSaveStatus('idle'), 3000);
            } else {
                setValidationErrors([testResult.message || 'Failed to connect to Google Cloud']);
                setSaveStatus('error');
            }
        } catch (error) {
            setValidationErrors([
                error instanceof Error ? error.message : 'Failed to test connection'
            ]);
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    // No longer needed for CLI mode

    const updateSetting = (key: keyof GoogleCloudSettings, value: string) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
        setSaveStatus('idle');
        setValidationErrors([]);
    };

    return (
        <div class="min-h-screen bg-gray-50">
            {/* Header */}
            <div class="bg-white border-b border-gray-200 shadow-sm">
                <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex items-center justify-between py-6">
                        <div class="flex items-center space-x-4">
                            <button
                                onClick={props.onBack}
                                class="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div>
                                <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
                                <p class="text-sm text-gray-500">Configure Google Cloud Transcoder API</p>
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={isSaving()}
                            class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Show when={isSaving()} fallback={<SaveIcon class="w-4 h-4 mr-2" />}>
                                <div class="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"></div>
                            </Show>
                            {isSaving() ? 'Testing & Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Status Messages */}
                <Show when={saveStatus() === 'success'}>
                    <div class="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                        <div class="flex items-center">
                            <CheckIcon class="w-5 h-5 text-green-600 mr-3" />
                            <div>
                                <h3 class="text-sm font-medium text-green-800">Settings Saved Successfully</h3>
                                <p class="text-sm text-green-700">Connection to Google Cloud verified.</p>
                            </div>
                        </div>
                    </div>
                </Show>

                <Show when={validationErrors().length > 0}>
                    <div class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                        <div class="flex items-start">
                            <AlertCircleIcon class="w-5 h-5 text-red-600 mr-3 mt-0.5" />
                            <div>
                                <h3 class="text-sm font-medium text-red-800">Configuration Errors</h3>
                                <ul class="mt-2 text-sm text-red-700 list-disc list-inside">
                                    {validationErrors().map(error => <li>{error}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                </Show>

                {/* Settings Form */}
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div class="p-6 space-y-6">
                        {/* Project Configuration */}
                        <div>
                            <h3 class="text-lg font-medium text-gray-900 mb-4">Project Configuration</h3>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        Project ID *
                                    </label>
                                    <input
                                        type="text"
                                        value={localSettings().projectId}
                                        onInput={(e) => updateSetting('projectId', e.currentTarget.value)}
                                        placeholder="your-gcp-project-id"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <p class="mt-1 text-xs text-gray-500">
                                        Your Google Cloud Project ID where the Transcoder API is enabled
                                    </p>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        Location *
                                    </label>
                                    <select
                                        value={localSettings().location}
                                        onChange={(e) => updateSetting('location', e.currentTarget.value)}
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="us-central1">us-central1 (Iowa)</option>
                                        <option value="us-east1">us-east1 (South Carolina)</option>
                                        <option value="us-east4">us-east4 (Northern Virginia)</option>
                                        <option value="us-west1">us-west1 (Oregon)</option>
                                        <option value="us-west2">us-west2 (Los Angeles)</option>
                                        <option value="us-west3">us-west3 (Salt Lake City)</option>
                                        <option value="us-west4">us-west4 (Las Vegas)</option>
                                        <option value="europe-west1">europe-west1 (Belgium)</option>
                                        <option value="europe-west2">europe-west2 (London)</option>
                                        <option value="europe-west3">europe-west3 (Frankfurt)</option>
                                        <option value="europe-west4">europe-west4 (Netherlands)</option>
                                        <option value="europe-west6">europe-west6 (Zurich)</option>
                                        <option value="asia-east1">asia-east1 (Taiwan)</option>
                                        <option value="asia-northeast1">asia-northeast1 (Tokyo)</option>
                                        <option value="asia-southeast1">asia-southeast1 (Singapore)</option>
                                        <option value="australia-southeast1">australia-southeast1 (Sydney)</option>
                                    </select>
                                    <p class="mt-1 text-xs text-gray-500">
                                        The region where your transcoder jobs are located
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* CLI Authentication Info */}
                        <div>
                            <h3 class="text-lg font-medium text-gray-900 mb-4">Authentication</h3>
                            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div class="flex items-start">
                                    <div class="flex-shrink-0">
                                        <CheckIcon class="w-5 h-5 text-blue-600 mt-0.5" />
                                    </div>
                                    <div class="ml-3">
                                        <h4 class="text-sm font-medium text-blue-900">CLI Mode Active</h4>
                                        <p class="text-sm text-blue-800 mt-1">
                                            Authentication is handled automatically by <code class="bg-blue-100 px-1 rounded">gcloud CLI</code>.
                                            Make sure you're logged in with <code class="bg-blue-100 px-1 rounded">gcloud auth login</code>
                                            or <code class="bg-blue-100 px-1 rounded">gcloud auth application-default login</code>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Help Section */}
                        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h4 class="text-sm font-medium text-green-900 mb-2">CLI Setup Guide</h4>
                            <div class="text-sm text-green-800 space-y-1">
                                <p>• <strong>Project ID:</strong> Find it in the Google Cloud Console project selector</p>
                                <p>• <strong>Location:</strong> Choose the region where your transcoder jobs are located</p>
                                <p>• <strong>Authentication:</strong> Run <code class="bg-green-100 px-1 rounded">gcloud auth login</code> in your terminal</p>
                                <p>• <strong>No rate limits:</strong> CLI mode bypasses API quotas for better performance</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
