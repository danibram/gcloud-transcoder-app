import { Component, For, Show, createEffect } from 'solid-js';
import { TranscoderJob } from '../types';
import {
    AlertCircleIcon,
    CalendarIcon,
    ClockIcon,
    DownloadIcon,
    MonitorIcon,
    TagIcon,
    UploadIcon,
    XIcon
} from './Icons';

interface JobModalProps {
    job: TranscoderJob | null;
    isOpen: boolean;
    onClose: () => void;
}

const JobModal: Component<JobModalProps> = (props) => {
    const getJobId = (name: string): string => {
        const parts = name.split('/');
        return parts[parts.length - 1];
    };

    const getStateColor = (state: string): string => {
        switch (state.toLowerCase()) {
            case 'succeeded':
                return 'bg-green-100 text-green-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            case 'running':
                return 'bg-blue-100 text-blue-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString: string): string => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    };

    // Handle escape key and body scroll
    createEffect(() => {
        if (props.isOpen) {
            document.body.style.overflow = 'hidden';

            const handleEscape = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    props.onClose();
                }
            };

            document.addEventListener('keydown', handleEscape);

            return () => {
                document.body.style.overflow = 'auto';
                document.removeEventListener('keydown', handleEscape);
            };
        } else {
            document.body.style.overflow = 'auto';
        }
    });

    return (
        <Show when={props.isOpen && props.job}>
            <div
                class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        props.onClose();
                    }
                }}
            >
                <div class="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div class="flex items-center justify-between p-6 border-b border-gray-200">
                        <div class="flex items-center space-x-3">
                            <MonitorIcon class="w-6 h-6 text-blue-600" />
                            <div>
                                <h2 class="text-xl font-semibold text-gray-900">Job Details</h2>
                                <p class="text-sm text-gray-500">
                                    ID: {props.job ? getJobId(props.job.name) : ''}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={props.onClose}
                            class="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <XIcon class="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div class="p-6 space-y-6">
                        <Show when={props.job}>
                            {(job) => (
                                <>
                                    {/* Status */}
                                    <div class="flex items-center space-x-3">
                                        <span class="text-sm font-medium text-gray-700">Status:</span>
                                        <span class={`px-3 py-1 rounded-full text-sm font-medium ${getStateColor(job().state || '')}`}>
                                            {job().state || 'Unknown'}
                                        </span>
                                    </div>

                                    {/* Input/Output Information */}
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div class="space-y-4">
                                            <h3 class="text-lg font-medium text-gray-900 flex items-center">
                                                <UploadIcon class="w-5 h-5 mr-2 text-blue-600" />
                                                Input Information
                                            </h3>
                                            <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                <p class="text-sm font-medium text-gray-700 mb-1">Input URI:</p>
                                                <p class="text-sm text-gray-600 break-all">{job().inputUri || 'N/A'}</p>
                                            </div>
                                        </div>

                                        <div class="space-y-4">
                                            <h3 class="text-lg font-medium text-gray-900 flex items-center">
                                                <DownloadIcon class="w-5 h-5 mr-2 text-green-600" />
                                                Output Information
                                            </h3>
                                            <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                <p class="text-sm font-medium text-gray-700 mb-1">Output URI:</p>
                                                <p class="text-sm text-gray-600 break-all">{job().outputUri || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Timeline */}
                                    <div>
                                        <h3 class="text-lg font-medium text-gray-900 flex items-center mb-4">
                                            <ClockIcon class="w-5 h-5 mr-2 text-purple-600" />
                                            Timeline
                                        </h3>
                                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                <p class="text-sm font-medium text-gray-700 mb-1 flex items-center">
                                                    <CalendarIcon class="w-4 h-4 mr-1" />
                                                    Created
                                                </p>
                                                <p class="text-sm text-gray-600">{formatDate(job().createTime || '')}</p>
                                            </div>
                                            <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                <p class="text-sm font-medium text-gray-700 mb-1 flex items-center">
                                                    <CalendarIcon class="w-4 h-4 mr-1" />
                                                    Started
                                                </p>
                                                <p class="text-sm text-gray-600">{formatDate(job().startTime || '')}</p>
                                            </div>
                                            <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                <p class="text-sm font-medium text-gray-700 mb-1 flex items-center">
                                                    <CalendarIcon class="w-4 h-4 mr-1" />
                                                    Ended
                                                </p>
                                                <p class="text-sm text-gray-600">{formatDate(job().endTime || '')}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Labels */}
                                    <Show when={job().labels && Object.keys(job().labels!).length > 0}>
                                        <div>
                                            <h3 class="text-lg font-medium text-gray-900 flex items-center mb-4">
                                                <TagIcon class="w-5 h-5 mr-2 text-indigo-600" />
                                                Labels
                                            </h3>
                                            <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                <div class="flex flex-wrap gap-2">
                                                    <For each={Object.entries(job().labels || {})}>
                                                        {([key, value]) => (
                                                            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800">
                                                                {key}: {value}
                                                            </span>
                                                        )}
                                                    </For>
                                                </div>
                                            </div>
                                        </div>
                                    </Show>

                                    {/* Error Information */}
                                    <Show when={job().error}>
                                        <div>
                                            <h3 class="text-lg font-medium text-red-900 flex items-center mb-4">
                                                <AlertCircleIcon class="w-5 h-5 mr-2 text-red-600" />
                                                Error Details
                                            </h3>
                                            <div class="bg-red-50 border border-red-200 p-4 rounded-lg">
                                                <pre class="text-sm text-red-800 whitespace-pre-wrap overflow-x-auto">
                                                    {JSON.stringify(job().error, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    </Show>

                                    {/* Configuration */}
                                    <Show when={job().config}>
                                        <div>
                                            <h3 class="text-lg font-medium text-gray-900 mb-4">Configuration</h3>
                                            <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                <pre class="text-sm text-gray-600 whitespace-pre-wrap overflow-x-auto">
                                                    {JSON.stringify(job().config, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    </Show>

                                    {/* Additional Info */}
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <p class="text-sm font-medium text-gray-700 mb-1">TTL After Completion:</p>
                                            <p class="text-sm text-gray-600">{job().ttlAfterCompletionDays} days</p>
                                        </div>
                                        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <p class="text-sm font-medium text-gray-700 mb-1">Full Job Name:</p>
                                            <p class="text-sm text-gray-600 break-all">{job().name}</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </Show>
                    </div>

                    {/* Footer */}
                    <div class="flex justify-end p-6 border-t border-gray-200">
                        <button
                            onClick={props.onClose}
                            class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </Show>
    );
};

export default JobModal;

