import { Component } from 'solid-js';

const Dashboard: Component = () => {
    return (
        <section class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div class="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 class="text-xl font-semibold text-gray-900 mb-2">
                        Dashboard Overview
                    </h2>
                    <p class="text-gray-600">
                        Monitor and manage your Google Cloud Transcoder API jobs via CLI • No rate limits
                    </p>
                </div>

                <div class="flex items-center space-x-6 text-sm text-gray-500">
                    <div class="flex items-center space-x-2">
                        <div class="w-3 h-3 bg-green-400 rounded-full"></div>
                        <span>Succeeded</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <div class="w-3 h-3 bg-blue-400 rounded-full"></div>
                        <span>Running</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <div class="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <span>Pending</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <div class="w-3 h-3 bg-red-400 rounded-full"></div>
                        <span>Failed</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Dashboard;
