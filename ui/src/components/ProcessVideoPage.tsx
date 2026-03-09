import { Component, createSignal, For, onMount, Show } from 'solid-js';
import { api } from '../tauri';
import { CreateJobData, JobTemplate } from '../types';
import {
    AlertCircleIcon,
    CheckIcon,
    PlayIcon
} from './Icons';

interface ProcessVideoPageProps {
    onBack: () => void;
}

const ProcessVideoPage: Component<ProcessVideoPageProps> = (props) => {
    const [templates, setTemplates] = createSignal<JobTemplate[]>([]);
    const [isSubmitting, setIsSubmitting] = createSignal(false);
    const [error, setError] = createSignal<string | null>(null);
    const [success, setSuccess] = createSignal<string | null>(null);

    const [formData, setFormData] = createSignal<CreateJobData>({
        inputUri: '',
        outputUri: '',
        templateId: 'preset/web-hd',
        batchModePriority: 10
    });

    const fetchTemplates = async () => {
        try {
            setError(null);

            const result = await api.templatesList();
            setTemplates(result);
        } catch (err) {
            console.error('Error fetching templates:', err);
            setTemplates([]);
        } finally {
        }
    };

    const handleSubmit = async (e: Event) => {
        e.preventDefault();

        try {
            setIsSubmitting(true);
            setError(null);
            setSuccess(null);

            const result = await api.jobCreate(formData());
            setSuccess(`Job created successfully! Job ID: ${result.name.split('/').pop()}`);
            setFormData({
                inputUri: '',
                outputUri: '',
                templateId: 'preset/web-hd',
                batchModePriority: 10
            });
        } catch (err) {
            console.error('Error creating job:', err);
            setError(err instanceof Error ? err.message : 'Failed to create transcoding job');
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateFormField = (field: keyof CreateJobData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null);
        setSuccess(null);
    };

    const extractTemplateId = (name: string) => {
        return name.split('/').pop() || name;
    };

    const validateForm = () => {
        const data = formData();
        return data.inputUri.trim() && data.outputUri.trim();
    };

    onMount(() => {
        fetchTemplates();
    });

    return (
        <div class="min-h-screen bg-gray-50">
            {/* Header */}
            <div class="bg-white border-b border-gray-200 shadow-sm">
                <div class="w-full px-4 sm:px-6 lg:px-8">
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
                                <h1 class="text-2xl font-bold text-gray-900">Process Video</h1>
                                <p class="text-sm text-gray-500">Create transcoding jobs from your GCS buckets</p>
                            </div>
                        </div>

                        <div class="flex items-center space-x-2">
                            <div class="flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                <div class="w-2 h-2 bg-green-400 rounded-full"></div>
                                <span>CLI Mode</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Status Messages */}
                <Show when={success()}>
                    <div class="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                        <div class="flex items-center">
                            <CheckIcon class="w-5 h-5 text-green-600 mr-3" />
                            <div>
                                <h3 class="text-sm font-medium text-green-800">Job Created Successfully</h3>
                                <p class="text-sm text-green-700">{success()}</p>
                            </div>
                        </div>
                    </div>
                </Show>

                <Show when={error()}>
                    <div class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                        <div class="flex items-center">
                            <AlertCircleIcon class="w-5 h-5 text-red-600 mr-3" />
                            <div>
                                <h3 class="text-sm font-medium text-red-800">Error</h3>
                                <p class="text-sm text-red-700">{error()}</p>
                            </div>
                        </div>
                    </div>
                </Show>

                {/* Form */}
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <h2 class="text-lg font-semibold text-gray-900">Create Transcoding Job</h2>
                        <p class="text-sm text-gray-500">
                            Process videos from your Google Cloud Storage buckets using templates
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} class="p-6 space-y-6">
                        {/* Input URI */}
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Input Video URI *
                            </label>
                            <input
                                type="text"
                                value={formData().inputUri}
                                onInput={(e) => updateFormField('inputUri', e.currentTarget.value)}
                                placeholder="gs://your-bucket-name/input/video.mp4"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                            <p class="mt-1 text-xs text-gray-500">
                                Full Google Cloud Storage URI to your input video file
                            </p>
                        </div>

                        {/* Output URI */}
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Output Folder URI *
                            </label>
                            <input
                                type="text"
                                value={formData().outputUri}
                                onInput={(e) => updateFormField('outputUri', e.currentTarget.value)}
                                placeholder="gs://your-bucket-name/output/"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                            <p class="mt-1 text-xs text-gray-500">
                                Google Cloud Storage folder where processed videos will be saved (must end with /)
                            </p>
                        </div>

                        {/* Template Selection */}
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Template
                            </label>
                            <select
                                value={formData().templateId}
                                onChange={(e) => updateFormField('templateId', e.currentTarget.value)}
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {/* Default presets */}
                                <optgroup label="Default Presets">
                                    <option value="preset/web-hd">Web HD (1280x720)</option>
                                    <option value="preset/web-sd">Web SD (640x360)</option>
                                </optgroup>

                                {/* Custom templates */}
                                <Show when={templates().length > 0}>
                                    <optgroup label="Custom Templates">
                                        <For each={templates()}>
                                            {(template) => (
                                                <option value={extractTemplateId(template.name)}>
                                                    {template.displayName || extractTemplateId(template.name)}
                                                </option>
                                            )}
                                        </For>
                                    </optgroup>
                                </Show>
                            </select>
                            <p class="mt-1 text-xs text-gray-500">
                                Choose a template that defines the output format and quality
                            </p>
                        </div>

                        {/* Batch Mode Priority */}
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Batch Mode Priority
                            </label>
                            <select
                                value={formData().batchModePriority}
                                onChange={(e) => updateFormField('batchModePriority', parseInt(e.currentTarget.value))}
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value={10}>10 - Low Priority (Cheaper)</option>
                                <option value={20}>20 - Medium Priority</option>
                                <option value={30}>30 - High Priority (Faster)</option>
                            </select>
                            <p class="mt-1 text-xs text-gray-500">
                                Higher priority jobs process faster but cost more
                            </p>
                        </div>

                        {/* Submit Button */}
                        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={props.onBack}
                                class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting() || !validateForm()}
                                class="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Show when={isSubmitting()} fallback={<PlayIcon class="w-4 h-4 mr-2" />}>
                                    <div class="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"></div>
                                </Show>
                                {isSubmitting() ? 'Creating Job...' : 'Start Processing'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Help Section */}
                <div class="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 class="text-sm font-medium text-blue-900 mb-3">💡 Tips for Processing Videos</h3>
                    <div class="text-sm text-blue-800 space-y-2">
                        <p>• <strong>Input URI:</strong> Must be a valid GCS path like <code class="bg-blue-100 px-1 rounded">gs://bucket/video.mp4</code></p>
                        <p>• <strong>Output URI:</strong> Should be a folder path ending with <code class="bg-blue-100 px-1 rounded">/</code></p>
                        <p>• <strong>Supported formats:</strong> MP4, MOV, AVI, MKV, WebM, and more</p>
                        <p>• <strong>Templates:</strong> Use custom templates for specific encoding requirements</p>
                        <p>• <strong>Batch Priority:</strong> Lower priority = cheaper processing, higher priority = faster processing</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProcessVideoPage;







