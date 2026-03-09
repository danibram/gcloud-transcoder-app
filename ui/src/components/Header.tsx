import { Component, Show } from 'solid-js';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { AlertCircleIcon, DownloadIcon, MonitorIcon, RefreshIcon, SettingsIcon, XIcon } from './Icons';
import type { AppUpdateState } from '../updater';

interface HeaderProps {
    onRefresh: () => void;
    onSettings: () => void;
    onTemplates: () => void;
    onProcess: () => void;
    onInstallUpdate: () => void;
    onDismissUpdate: () => void;
    isLoading: boolean;
    updateState: AppUpdateState;
}

const Header: Component<HeaderProps> = (props) => {
    const handleWindowDrag = (event: MouseEvent) => {
        if (event.button !== 0) {
            return;
        }

        void getCurrentWindow().startDragging();
    };

    const progressPercent = () => {
        const contentLength = props.updateState.contentLength ?? 0;
        const downloadedBytes = props.updateState.downloadedBytes ?? 0;

        if (contentLength <= 0) {
            return null;
        }

        return Math.min(100, Math.round((downloadedBytes / contentLength) * 100));
    };

    const bannerTone = () => {
        switch (props.updateState.status) {
            case 'available':
                return 'bg-amber-50 border-amber-200 text-amber-900';
            case 'downloading':
            case 'installing':
                return 'bg-blue-50 border-blue-200 text-blue-900';
            case 'error':
                return 'bg-red-50 border-red-200 text-red-900';
            default:
                return '';
        }
    };

    const bannerMessage = () => {
        switch (props.updateState.status) {
            case 'available':
                return `Version ${props.updateState.version} is ready to install.`;
            case 'downloading': {
                const percent = progressPercent();
                return percent === null
                    ? `Downloading version ${props.updateState.version}...`
                    : `Downloading version ${props.updateState.version}... ${percent}%`;
            }
            case 'installing':
                return 'Installing update and restarting the app...';
            case 'error':
                return props.updateState.message ?? 'Auto-update failed.';
            default:
                return '';
        }
    };

    const showUpdateBanner = () =>
        props.updateState.status === 'available' ||
        props.updateState.status === 'downloading' ||
        props.updateState.status === 'installing' ||
        props.updateState.status === 'error';

    return (
        <header class="bg-white border-b border-gray-200 shadow-sm">
            <div class="w-full px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center py-3 gap-4">
                    <div
                        class="flex items-center space-x-4 min-w-0 flex-1 cursor-move select-none"
                        data-tauri-drag-region
                        onMouseDown={handleWindowDrag}
                    >
                        <div class="w-[52px] shrink-0" aria-hidden="true" />
                        <div class="w-10 h-10 shrink-0 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                            <MonitorIcon class="w-5 h-5 text-white" />
                        </div>
                        <div class="min-w-0">
                            <h1 class="text-2xl font-bold text-gray-900">
                                Transcoder App
                            </h1>
                            <p class="text-sm text-gray-500">
                                Google Cloud Video Transcoder • CLI Mode
                            </p>
                        </div>
                    </div>

                    <div class="flex items-center space-x-3 shrink-0">
                        <button
                            onClick={props.onProcess}
                            class="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                        >
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <polygon points="5,3 19,12 5,21" />
                            </svg>
                            Process Video
                        </button>

                        <button
                            onClick={props.onTemplates}
                            class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Templates
                        </button>

                        <button
                            onClick={props.onSettings}
                            class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                            <SettingsIcon class="w-4 h-4 mr-2" />
                            Settings
                        </button>

                        <button
                            onClick={props.onRefresh}
                            disabled={props.isLoading}
                            class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <RefreshIcon
                                class={`w-4 h-4 mr-2 ${props.isLoading ? 'animate-spin' : ''}`}
                            />
                            {props.isLoading ? 'Loading...' : 'Refresh'}
                        </button>
                    </div>
                </div>

                <Show when={showUpdateBanner()}>
                    <div class={`mb-3 flex items-center justify-between gap-4 rounded-lg border px-4 py-3 ${bannerTone()}`}>
                        <div class="flex min-w-0 items-start gap-3">
                            <AlertCircleIcon class="mt-0.5 h-5 w-5 shrink-0" />
                            <div class="min-w-0">
                                <p class="text-sm font-semibold">
                                    {props.updateState.status === 'error' ? 'Update error' : 'App update'}
                                </p>
                                <p class="text-sm opacity-90">{bannerMessage()}</p>
                            </div>
                        </div>

                        <div class="flex shrink-0 items-center gap-2">
                            <Show when={props.updateState.status === 'available'}>
                                <button
                                    onClick={props.onInstallUpdate}
                                    class="inline-flex items-center rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                    <DownloadIcon class="mr-2 h-4 w-4" />
                                    Install {props.updateState.version}
                                </button>
                            </Show>

                            <Show when={props.updateState.status === 'available' || props.updateState.status === 'error'}>
                                <button
                                    onClick={props.onDismissUpdate}
                                    class="rounded-lg p-2 transition-colors hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                    aria-label="Dismiss update banner"
                                >
                                    <XIcon class="h-4 w-4" />
                                </button>
                            </Show>
                        </div>
                    </div>
                </Show>
            </div>
        </header>
    );
};

export default Header;
