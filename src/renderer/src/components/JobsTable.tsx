import { Component, For, Show } from 'solid-js';
import { JobState, TranscoderJob } from '../types';
import { AlertCircleIcon, CalendarIcon, ExternalLinkIcon, MonitorIcon, RefreshIcon } from './Icons';

interface JobsTableProps {
    jobs: TranscoderJob[];
    isLoading: boolean;
    error: string | null;
    onJobClick: (job: TranscoderJob) => void;
    onRefresh: () => void;
    currentPage: number;
    pageSize: number;
    totalJobs?: number;
    hasNextPage: boolean;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
}

const JobsTable: Component<JobsTableProps> = (props) => {

    const getJobId = (name: string): string => {
        const parts = name.split('/');
        return parts[parts.length - 1];
    };

    const getStateColor = (state: string): string => {
        const normalizedState = state.toLowerCase() as JobState;
        switch (normalizedState) {
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
        const date = new Date(dateString);
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    };

    const truncateUri = (uri: string, maxLength: number = 50): string => {
        if (!uri) return 'N/A';
        if (uri.length <= maxLength) return uri;
        return `${uri.substring(0, maxLength)}...`;
    };

    const startIndex = () => (props.currentPage - 1) * props.pageSize + 1;
    const endIndex = () => startIndex() + props.jobs.length - 1;

    return (
        <Show
            when={!props.error}
            fallback={
                <div class="max-w-4xl mx-auto">
                    <div class="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                        <div class="flex items-center">
                            <AlertCircleIcon class="w-6 h-6 text-red-600 mr-3 flex-shrink-0" />
                            <div class="flex-1">
                                <h3 class="text-lg font-medium text-red-900">Error Loading Jobs</h3>
                                <p class="text-red-700 mt-1">{props.error}</p>
                                <div class="mt-4">
                                    <button
                                        onClick={props.onRefresh}
                                        class="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                    >
                                        <RefreshIcon class="w-4 h-4 mr-2" />
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <h4 class="text-sm font-medium text-blue-900 mb-2">Setup Instructions:</h4>
                        <ol class="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                            <li>Run <code class="bg-blue-100 px-1 rounded">gcloud auth application-default login</code></li>
                            <li>Set your project ID in environment variables</li>
                            <li>Enable the Video Transcoder API in your project</li>
                            <li>Ensure you have proper permissions</li>
                        </ol>
                    </div>
                </div>
            }
        >
            <Show
                when={props.jobs.length > 0 || props.isLoading}
                fallback={
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                        <div class="text-center">
                            <MonitorIcon class="mx-auto w-16 h-16 text-gray-400 mb-4" />
                            <h3 class="text-lg font-medium text-gray-900 mb-2">No transcoder jobs</h3>
                            <p class="text-gray-500 mb-6">
                                No transcoder jobs found. Create a new job to get started.
                            </p>
                            <button
                                onClick={props.onRefresh}
                                class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                                <RefreshIcon class="w-4 h-4 mr-2" />
                                Refresh
                            </button>
                        </div>
                    </div>
                }
            >
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <MonitorIcon class="w-5 h-5 text-blue-600" />
                            <h3 class="text-lg font-medium text-gray-900">Transcoder Jobs</h3>
                            <Show when={props.totalJobs !== undefined}>
                                <span class="text-sm text-gray-500">
                                    ({props.totalJobs} total)
                                </span>
                            </Show>
                        </div>
                        <div class="flex items-center space-x-3">
                            <label class="text-sm text-gray-600">
                                Show:
                                <select
                                    value={props.pageSize}
                                    onChange={(e) => props.onPageSizeChange(Number(e.currentTarget.value))}
                                    class="ml-2 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </label>
                        </div>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Job ID
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Input URI
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Output URI
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                <For each={props.jobs}>
                                    {(job) => (
                                        <tr
                                            class="hover:bg-gray-50 cursor-pointer transition-colors"
                                            onClick={() => props.onJobClick(job)}
                                        >
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <div class="text-sm font-medium text-gray-900">
                                                    {getJobId(job.name)}
                                                </div>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <span class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStateColor(job.state || '')}`}>
                                                    {job.state || 'Unknown'}
                                                </span>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <div class="text-sm text-gray-900" title={job.inputUri}>
                                                    {truncateUri(job.inputUri || '')}
                                                </div>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <div class="text-sm text-gray-900" title={job.outputUri}>
                                                    {truncateUri(job.outputUri || '')}
                                                </div>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <div class="flex items-center text-sm text-gray-500">
                                                    <CalendarIcon class="w-4 h-4 mr-1" />
                                                    {formatDate(job.createTime || '')}
                                                </div>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        props.onJobClick(job);
                                                    }}
                                                    class="text-blue-600 hover:text-blue-900 inline-flex items-center transition-colors"
                                                >
                                                    <ExternalLinkIcon class="w-4 h-4 mr-1" />
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    )}
                                </For>
                            </tbody>
                        </table>
                    </div>

                    <Show when={props.isLoading}>
                        <div class="px-6 py-4 text-center">
                            <div class="inline-flex items-center text-sm text-gray-500">
                                <RefreshIcon class="animate-spin w-4 h-4 mr-2" />
                                Loading jobs...
                            </div>
                        </div>
                    </Show>

                    {/* Pagination Controls */}
                    <Show when={props.jobs.length > 0}>
                        <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            <div class="text-sm text-gray-700">
                                Showing <span class="font-medium">{startIndex()}</span> to{' '}
                                <span class="font-medium">{endIndex()}</span>
                                <Show when={props.totalJobs !== undefined}>
                                    {' '}of <span class="font-medium">{props.totalJobs}</span>
                                </Show>
                                {' '}jobs
                            </div>
                            <div class="flex items-center space-x-2">
                                <button
                                    onClick={() => props.onPageChange(1)}
                                    disabled={props.currentPage === 1}
                                    class="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    title="First page"
                                >
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => props.onPageChange(props.currentPage - 1)}
                                    disabled={props.currentPage === 1}
                                    class="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
                                </button>
                                <span class="text-sm text-gray-700">
                                    Page <span class="font-medium">{props.currentPage}</span>
                                </span>
                                <button
                                    onClick={() => props.onPageChange(props.currentPage + 1)}
                                    disabled={!props.hasNextPage}
                                    class="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </Show>
                </div>
            </Show>
        </Show>
    );
};

export default JobsTable;

