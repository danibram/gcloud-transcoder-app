import { Component } from 'solid-js';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { MonitorIcon, RefreshIcon, SettingsIcon } from './Icons';

interface HeaderProps {
    onRefresh: () => void;
    onSettings: () => void;
    onTemplates: () => void;
    onProcess: () => void;
    isLoading: boolean;
}

const Header: Component<HeaderProps> = (props) => {
    const handleWindowDrag = (event: MouseEvent) => {
        if (event.button !== 0) {
            return;
        }

        void getCurrentWindow().startDragging();
    };

    return (
        <header class="bg-white border-b border-gray-200 shadow-sm">
            <div class="w-full px-4 sm:px-6 lg:px-8">
                <div
                    class="flex justify-between items-center py-3 gap-4"
                >
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
            </div>
        </header>
    );
};

export default Header;
