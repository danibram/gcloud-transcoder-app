import { Component, createSignal, For, onMount, Show } from 'solid-js';
import { settings } from '../stores/settingsStore';
import { JobTemplate } from '../types';
import {
    AlertCircleIcon,
    EditIcon,
    PlusIcon,
    SaveIcon,
    TrashIcon,
    XIcon
} from './Icons';

interface TemplatesPageProps {
    onBack: () => void;
}

const TemplatesPage: Component<TemplatesPageProps> = (props) => {
    const [templates, setTemplates] = createSignal<JobTemplate[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [error, setError] = createSignal<string | null>(null);
    const [selectedTemplate, setSelectedTemplate] = createSignal<JobTemplate | null>(null);
    const [isModalOpen, setIsModalOpen] = createSignal(false);
    const [modalMode, setModalMode] = createSignal<'view' | 'edit' | 'create'>('view');
    const [isSubmitting, setIsSubmitting] = createSignal(false);
    const [formData, setFormData] = createSignal<Partial<JobTemplate>>({});
    const [modalError, setModalError] = createSignal<string | null>(null);

    const fetchTemplates = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const currentSettings = settings();
            const result = await window.electronAPI.listJobTemplates(currentSettings);

            if (result.success && result.data) {
                setTemplates(result.data);
            } else {
                setError(result.error || 'Failed to fetch job templates');
            }
        } catch (err) {
            console.error('Error fetching templates:', err);
            setError('Failed to connect to Google Cloud API. Please check your settings.');
        } finally {
            setIsLoading(false);
        }
    };

    const openModal = (mode: 'view' | 'edit' | 'create', template?: JobTemplate) => {
        setModalMode(mode);
        setModalError(null); // Clear any previous modal errors
        if (template) {
            setSelectedTemplate(template);
            setFormData({
                name: template.name,
                displayName: template.displayName,
                config: template.config,
                labels: template.labels
            });
        } else {
            setSelectedTemplate(null);
            setFormData({
                name: '',
                displayName: '',
                config: {},
                labels: {}
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedTemplate(null);
        setFormData({});
        setIsSubmitting(false);
        setModalError(null);
    };

    const handleSubmit = async () => {
        try {
            // For edit mode, warn user that update = delete + recreate
            if (modalMode() === 'edit') {
                const confirmed = confirm(
                    '⚠️ Warning: Google Cloud Transcoder API does not support direct template updates.\n\n' +
                    'This operation will DELETE the existing template and CREATE a new one with the same name.\n\n' +
                    'If something fails during recreation, the template may be lost.\n\n' +
                    'Do you want to continue?'
                );
                if (!confirmed) {
                    return;
                }
            }

            setIsSubmitting(true);
            setModalError(null); // Clear previous modal errors
            const currentSettings = settings();

            let result;
            if (modalMode() === 'create') {
                result = await window.electronAPI.createJobTemplate(formData(), currentSettings);
            } else if (modalMode() === 'edit' && selectedTemplate()) {
                const templateId = selectedTemplate()!.name.split('/').pop()!;
                result = await window.electronAPI.updateJobTemplate(templateId, formData(), currentSettings);
            }

            if (result?.success) {
                closeModal();
                await fetchTemplates(); // Refresh list
            } else {
                // Show the error in the modal for better visibility
                setModalError(result?.error || 'Operation failed');
            }
        } catch (err) {
            console.error('Error submitting template:', err);
            setModalError('Failed to save template: ' + (err instanceof Error ? err.message : String(err)));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (template: JobTemplate) => {
        if (!confirm(`Are you sure you want to delete template "${template.displayName || template.name}"?`)) {
            return;
        }

        try {
            setIsLoading(true);
            const currentSettings = settings();
            const templateId = template.name.split('/').pop()!;

            const result = await window.electronAPI.deleteJobTemplate(templateId, currentSettings);

            if (result.success) {
                await fetchTemplates(); // Refresh list
            } else {
                setError(result.error || 'Failed to delete template');
            }
        } catch (err) {
            console.error('Error deleting template:', err);
            setError('Failed to delete template');
        } finally {
            setIsLoading(false);
        }
    };

    const updateFormField = (field: keyof JobTemplate, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    const extractTemplateId = (name: string) => {
        return name.split('/').pop() || name;
    };

    onMount(() => {
        fetchTemplates();
    });

    return (
        <div class="min-h-screen bg-gray-50">
            {/* Header */}
            <div class="bg-white border-b border-gray-200 shadow-sm">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                                <h1 class="text-2xl font-bold text-gray-900">Job Templates</h1>
                                <p class="text-sm text-gray-500">Manage video transcoding templates</p>
                            </div>
                        </div>

                        <div class="flex items-center space-x-3">
                            <button
                                onClick={() => openModal('create')}
                                class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                                <PlusIcon class="w-4 h-4 mr-2" />
                                New Template
                            </button>

                            <button
                                onClick={fetchTemplates}
                                disabled={isLoading()}
                                class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <svg class={`w-4 h-4 mr-2 ${isLoading() ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                {isLoading() ? 'Loading...' : 'Refresh'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Error Message */}
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

                {/* Templates Table */}
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <h2 class="text-lg font-semibold text-gray-900">Templates</h2>
                        <p class="text-sm text-gray-500">
                            {templates().length} template{templates().length !== 1 ? 's' : ''} found
                        </p>
                    </div>

                    <Show when={isLoading()} fallback={
                        <Show when={templates().length > 0} fallback={
                            <div class="px-6 py-12 text-center">
                                <div class="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                    <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 class="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                                <p class="text-gray-500 mb-4">Get started by creating your first job template.</p>
                                <button
                                    onClick={() => openModal('create')}
                                    class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <PlusIcon class="w-4 h-4 mr-2" />
                                    Create Template
                                </button>
                            </div>
                        }>
                            <div class="overflow-x-auto">
                                <table class="w-full">
                                    <thead class="bg-gray-50">
                                        <tr>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Display Name</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody class="bg-white divide-y divide-gray-200">
                                        <For each={templates()}>
                                            {(template) => (
                                                <tr class="hover:bg-gray-50 transition-colors">
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <div class="text-sm font-medium text-gray-900">
                                                            {extractTemplateId(template.name)}
                                                        </div>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <div class="text-sm text-gray-900">
                                                            {template.displayName || 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatDate(template.createTime)}
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatDate(template.updateTime)}
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div class="flex items-center justify-end space-x-2">
                                                            <button
                                                                onClick={() => openModal('view', template)}
                                                                class="text-blue-600 hover:text-blue-900 transition-colors"
                                                                title="View details"
                                                            >
                                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => openModal('edit', template)}
                                                                class="text-green-600 hover:text-green-900 transition-colors"
                                                                title="Edit template"
                                                            >
                                                                <EditIcon class="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(template)}
                                                                class="text-red-600 hover:text-red-900 transition-colors"
                                                                title="Delete template"
                                                            >
                                                                <TrashIcon class="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </For>
                                    </tbody>
                                </table>
                            </div>
                        </Show>
                    }>
                        <div class="px-6 py-12 text-center">
                            <div class="w-8 h-8 mx-auto mb-4 animate-spin border-2 border-blue-600 border-t-transparent rounded-full"></div>
                            <p class="text-gray-500">Loading templates...</p>
                        </div>
                    </Show>
                </div>
            </div>

            {/* Modal */}
            <Show when={isModalOpen()}>
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div class="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div class="flex items-center justify-between p-6 border-b border-gray-200">
                            <h3 class="text-lg font-semibold text-gray-900">
                                {modalMode() === 'create' ? 'Create Template' :
                                    modalMode() === 'edit' ? 'Edit Template' : 'Template Details'}
                            </h3>
                            <button
                                onClick={closeModal}
                                class="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <XIcon class="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div class="p-6 space-y-6">
                            {/* Modal Error Message */}
                            <Show when={modalError()}>
                                <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <div class="flex items-start">
                                        <AlertCircleIcon class="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                                        <div class="flex-1 min-w-0">
                                            <h3 class="text-sm font-medium text-red-800 mb-1">Error</h3>
                                            <pre class="text-sm text-red-700 whitespace-pre-wrap break-words font-mono bg-red-100 p-2 rounded max-h-48 overflow-auto">
                                                {modalError()}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            </Show>

                            <Show when={modalMode() === 'view'} fallback={
                                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-6">
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                                Template Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData().name || ''}
                                                onInput={(e) => updateFormField('name', e.currentTarget.value)}
                                                placeholder="my-template"
                                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                required
                                                disabled={modalMode() === 'edit'}
                                            />
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                                Display Name
                                                <span class="text-xs text-amber-600 ml-2">(Not supported by API - for reference only)</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData().displayName || ''}
                                                onInput={(e) => updateFormField('displayName', e.currentTarget.value)}
                                                placeholder="My Template"
                                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                disabled
                                            />
                                            <p class="mt-1 text-xs text-gray-500">
                                                The Google Cloud Transcoder API does not support display names for templates.
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">
                                            Configuration (JSON)
                                        </label>
                                        <textarea
                                            value={JSON.stringify(formData().config || {}, null, 2)}
                                            onInput={(e) => {
                                                try {
                                                    const config = JSON.parse(e.currentTarget.value);
                                                    updateFormField('config', config);
                                                } catch (err) {
                                                    // Invalid JSON, don't update
                                                }
                                            }}
                                            placeholder='{"inputs": [], "elementaryStreams": [], "muxStreams": []}'
                                            rows="10"
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                                        />
                                        <p class="mt-1 text-xs text-gray-500">
                                            Enter the template configuration in JSON format
                                        </p>
                                    </div>

                                    <div class="flex justify-end space-x-3">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting()}
                                            class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <Show when={isSubmitting()} fallback={<SaveIcon class="w-4 h-4 mr-2" />}>
                                                <div class="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"></div>
                                            </Show>
                                            {isSubmitting() ? 'Saving...' : modalMode() === 'create' ? 'Create' : 'Update'}
                                        </button>
                                    </div>
                                </form>
                            }>
                                {/* View Mode */}
                                <div class="space-y-6">
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                                            <p class="text-sm text-gray-900">{extractTemplateId(selectedTemplate()?.name || '')}</p>
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                                            <p class="text-sm text-gray-900">{selectedTemplate()?.displayName || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Created</label>
                                            <p class="text-sm text-gray-900">{formatDate(selectedTemplate()?.createTime)}</p>
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Updated</label>
                                            <p class="text-sm text-gray-900">{formatDate(selectedTemplate()?.updateTime)}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Configuration</label>
                                        <pre class="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm overflow-x-auto">
                                            {JSON.stringify(selectedTemplate()?.config || {}, null, 2)}
                                        </pre>
                                    </div>

                                    <div class="flex justify-end space-x-3">
                                        <button
                                            onClick={() => openModal('edit', selectedTemplate()!)}
                                            class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            <EditIcon class="w-4 h-4 mr-2" />
                                            Edit Template
                                        </button>
                                    </div>
                                </div>
                            </Show>
                        </div>
                    </div>
                </div>
            </Show>
        </div>
    );
};

export default TemplatesPage;









