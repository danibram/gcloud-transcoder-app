import { Component, createEffect, createSignal, For, Show } from 'solid-js';
import { settings } from '../stores/settingsStore';
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
    const [showDebug, setShowDebug] = createSignal(false);
    const [copiedCurl, setCopiedCurl] = createSignal(false);
    const [copiedRequest, setCopiedRequest] = createSignal(false);
    const [copiedUrls, setCopiedUrls] = createSignal<{ [key: string]: boolean }>({});

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

    const extractProjectAndLocation = (jobName: string) => {
        // Format: projects/{project}/locations/{location}/jobs/{job-id}
        const parts = jobName.split('/');
        return {
            project: parts[1] || settings().projectId,
            location: parts[3] || settings().location
        };
    };

    const generateCurlCommand = (job: TranscoderJob) => {
        const { project, location } = extractProjectAndLocation(job.name);
        const jobConfig = JSON.stringify(job.config, null, 2);

        return `curl -X POST \\
  "https://transcoder.googleapis.com/v1/projects/${project}/locations/${location}/jobs" \\
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \\
  -H "Content-Type: application/json" \\
  -d '${jobConfig}'`;
    };

    const generateRestApiUrl = (job: TranscoderJob) => {
        const { project, location } = extractProjectAndLocation(job.name);
        return `https://transcoder.googleapis.com/v1/projects/${project}/locations/${location}/jobs`;
    };

    const generateRequestBody = (job: TranscoderJob) => {
        return JSON.stringify(job.config, null, 2);
    };

    const copyToClipboard = async (text: string, type: 'curl' | 'request') => {
        try {
            await navigator.clipboard.writeText(text);
            if (type === 'curl') {
                setCopiedCurl(true);
                setTimeout(() => setCopiedCurl(false), 2000);
            } else {
                setCopiedRequest(true);
                setTimeout(() => setCopiedRequest(false), 2000);
            }
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const copyUrlToClipboard = async (url: string, key: string) => {
        try {
            await navigator.clipboard.writeText(url);
            setCopiedUrls({ ...copiedUrls(), [key]: true });
            setTimeout(() => {
                const updated = { ...copiedUrls() };
                delete updated[key];
                setCopiedUrls(updated);
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const extractOutputVideos = (job: TranscoderJob) => {
        const videos: Array<{ name: string; url: string }> = [];

        if (!job.config) return videos;

        const outputUri = job.config.output?.uri || job.outputUri || '';
        const muxStreams = job.config.muxStreams || [];

        // Extract output videos from mux streams
        muxStreams.forEach((mux: any, index: number) => {
            const container = mux.container || 'mp4';
            const fileName = mux.fileName || `output_${index}.${container}`;

            // Build full URL
            let fullUrl = outputUri;
            if (outputUri && !outputUri.endsWith('/')) {
                fullUrl += '/';
            }
            fullUrl += fileName;

            videos.push({
                name: fileName,
                url: fullUrl
            });
        });

        // If no mux streams found, check for elementary streams or default output
        if (videos.length === 0 && outputUri) {
            videos.push({
                name: 'output.mp4',
                url: outputUri.endsWith('/') ? outputUri + 'output.mp4' : outputUri
            });
        }

        return videos;
    };

    const getPublicUrl = (gsUrl: string): string => {
        // Convert gs:// to https://storage.googleapis.com/
        if (gsUrl.startsWith('gs://')) {
            return gsUrl.replace('gs://', 'https://storage.googleapis.com/');
        }
        return gsUrl;
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

                                    {/* Output Videos Table */}
                                    <Show when={job().state?.toLowerCase() === 'succeeded' && extractOutputVideos(job()).length > 0}>
                                        <div>
                                            <h3 class="text-lg font-medium text-gray-900 flex items-center mb-4">
                                                <svg class="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                                Processed Videos
                                            </h3>
                                            <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                <table class="w-full divide-y divide-gray-200">
                                                    <thead class="bg-gray-50">
                                                        <tr>
                                                            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                File Name
                                                            </th>
                                                            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Storage URL (gs://)
                                                            </th>
                                                            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Public URL
                                                            </th>
                                                            <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Actions
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody class="bg-white divide-y divide-gray-200">
                                                        <For each={extractOutputVideos(job())}>
                                                            {(video, index) => (
                                                                <tr class="hover:bg-gray-50">
                                                                    <td class="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                        {video.name}
                                                                    </td>
                                                                    <td class="px-3 py-2 text-sm text-gray-600">
                                                                        <div class="flex items-center space-x-2">
                                                                            <span class="font-mono text-xs break-all">{video.url}</span>
                                                                            <button
                                                                                onClick={() => copyUrlToClipboard(video.url, `gs-${index()}`)}
                                                                                class="flex-shrink-0 p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                                                title="Copy gs:// URL"
                                                                            >
                                                                                {copiedUrls()[`gs-${index()}`] ? (
                                                                                    <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                                                                    </svg>
                                                                                ) : (
                                                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                                                    </svg>
                                                                                )}
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                    <td class="px-3 py-2 text-sm text-gray-600">
                                                                        <div class="flex items-center space-x-2">
                                                                            <a
                                                                                href={getPublicUrl(video.url)}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                class="font-mono text-xs text-blue-600 hover:text-blue-800 break-all"
                                                                            >
                                                                                {getPublicUrl(video.url)}
                                                                            </a>
                                                                            <button
                                                                                onClick={() => copyUrlToClipboard(getPublicUrl(video.url), `public-${index()}`)}
                                                                                class="flex-shrink-0 p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                                                title="Copy public URL"
                                                                            >
                                                                                {copiedUrls()[`public-${index()}`] ? (
                                                                                    <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                                                                    </svg>
                                                                                ) : (
                                                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                                                    </svg>
                                                                                )}
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                    <td class="px-3 py-2 whitespace-nowrap text-right text-sm">
                                                                        <a
                                                                            href={getPublicUrl(video.url)}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            class="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                                                        >
                                                                            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                            </svg>
                                                                            Open
                                                                        </a>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </For>
                                                    </tbody>
                                                </table>
                                            </div>
                                            <p class="text-xs text-gray-500 mt-2">
                                                💡 Tip: Click the copy icons to copy URLs to clipboard, or click "Open" to view the video
                                            </p>
                                        </div>
                                    </Show>

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

                                    {/* Debug Section for Google Team */}
                                    <div class="border-t border-gray-200 pt-6">
                                        <button
                                            onClick={() => setShowDebug(!showDebug())}
                                            class="flex items-center justify-between w-full text-left px-4 py-3 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors"
                                        >
                                            <div class="flex items-center space-x-2">
                                                <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                                </svg>
                                                <span class="font-medium text-orange-900">Debug Info (for Google Support)</span>
                                            </div>
                                            <svg
                                                class={`w-5 h-5 text-orange-600 transition-transform ${showDebug() ? 'rotate-180' : ''}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>

                                        <Show when={showDebug()}>
                                            <div class="mt-4 space-y-4">
                                                {/* REST API URL */}
                                                <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                                    <div class="flex items-center justify-between mb-2">
                                                        <h4 class="text-sm font-semibold text-blue-900">REST API Endpoint</h4>
                                                    </div>
                                                    <div class="bg-white p-3 rounded border border-blue-200">
                                                        <p class="text-sm font-mono text-gray-800 break-all">
                                                            POST {generateRestApiUrl(job())}
                                                        </p>
                                                    </div>
                                                    <p class="text-xs text-blue-700 mt-2">
                                                        Use this endpoint to reproduce the job via REST API
                                                    </p>
                                                </div>

                                                {/* Request Body */}
                                                <div class="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                                    <div class="flex items-center justify-between mb-2">
                                                        <h4 class="text-sm font-semibold text-purple-900">Request Body (JSON)</h4>
                                                        <button
                                                            onClick={() => copyToClipboard(generateRequestBody(job()), 'request')}
                                                            class="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors"
                                                        >
                                                            {copiedRequest() ? '✓ Copied!' : 'Copy JSON'}
                                                        </button>
                                                    </div>
                                                    <div class="bg-white p-3 rounded border border-purple-200 max-h-60 overflow-y-auto">
                                                        <pre class="text-xs font-mono text-gray-800 whitespace-pre-wrap">
                                                            {generateRequestBody(job())}
                                                        </pre>
                                                    </div>
                                                    <p class="text-xs text-purple-700 mt-2">
                                                        This is the exact configuration used for this job
                                                    </p>
                                                </div>

                                                {/* cURL Command */}
                                                <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                                                    <div class="flex items-center justify-between mb-2">
                                                        <h4 class="text-sm font-semibold text-green-900">Complete cURL Command</h4>
                                                        <button
                                                            onClick={() => copyToClipboard(generateCurlCommand(job()), 'curl')}
                                                            class="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                                                        >
                                                            {copiedCurl() ? '✓ Copied!' : 'Copy cURL'}
                                                        </button>
                                                    </div>
                                                    <div class="bg-white p-3 rounded border border-green-200 max-h-60 overflow-y-auto">
                                                        <pre class="text-xs font-mono text-gray-800 whitespace-pre-wrap">
                                                            {generateCurlCommand(job())}
                                                        </pre>
                                                    </div>
                                                    <p class="text-xs text-green-700 mt-2">
                                                        Run this command to reproduce the exact same job (requires gcloud CLI)
                                                    </p>
                                                </div>

                                                {/* Additional Debug Info */}
                                                <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                    <h4 class="text-sm font-semibold text-gray-900 mb-3">Additional Information</h4>
                                                    <div class="space-y-2 text-sm">
                                                        <div class="flex justify-between">
                                                            <span class="text-gray-600">Project ID:</span>
                                                            <span class="font-mono text-gray-800">{extractProjectAndLocation(job().name).project}</span>
                                                        </div>
                                                        <div class="flex justify-between">
                                                            <span class="text-gray-600">Location:</span>
                                                            <span class="font-mono text-gray-800">{extractProjectAndLocation(job().name).location}</span>
                                                        </div>
                                                        <div class="flex justify-between">
                                                            <span class="text-gray-600">Job ID:</span>
                                                            <span class="font-mono text-gray-800">{getJobId(job().name)}</span>
                                                        </div>
                                                        <div class="flex justify-between">
                                                            <span class="text-gray-600">API Version:</span>
                                                            <span class="font-mono text-gray-800">v1</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                                    <p class="text-xs text-yellow-800">
                                                        <strong>Note for Google Support:</strong> Use the REST API endpoint and request body above to reproduce this job.
                                                        The cURL command includes authentication and can be run directly from a terminal with gcloud CLI installed.
                                                    </p>
                                                </div>
                                            </div>
                                        </Show>
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
