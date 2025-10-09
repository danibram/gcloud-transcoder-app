import { Component, createSignal, onMount, Show } from 'solid-js';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import JobModal from './components/JobModal';
import JobsTable from './components/JobsTable';
import ProcessVideoPage from './components/ProcessVideoPage';
import SettingsPage from './components/SettingsPage';
import TemplatesPage from './components/TemplatesPage';
import { settings } from './stores/settingsStore';
import { TranscoderJob } from './types';

const App: Component = () => {
    const [jobs, setJobs] = createSignal<TranscoderJob[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [error, setError] = createSignal<string | null>(null);
    const [selectedJob, setSelectedJob] = createSignal<TranscoderJob | null>(null);
    const [isModalOpen, setIsModalOpen] = createSignal(false);
    const [currentPage, setCurrentPage] = createSignal<'dashboard' | 'settings' | 'templates' | 'process'>('dashboard');

    const fetchJobs = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Use settings from store
            const currentSettings = settings();
            const result = await window.electronAPI.listTranscoderJobs(currentSettings);

            if (result.success && result.data) {
                const sortedJobs = [...result.data].sort((a, b) => {
                    const aTime = a.createTime
                        ? new Date(a.createTime).getTime()
                        : (a.startTime ? new Date(a.startTime).getTime() : 0);
                    const bTime = b.createTime
                        ? new Date(b.createTime).getTime()
                        : (b.startTime ? new Date(b.startTime).getTime() : 0);
                    return bTime - aTime; // newest first
                });
                setJobs(sortedJobs);
            } else {
                setError(result.error || 'Failed to fetch transcoder jobs');
            }
        } catch (err) {
            console.error('Error fetching jobs:', err);
            setError('Failed to connect to Google Cloud API. Please check your settings.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleJobClick = (job: TranscoderJob) => {
        setSelectedJob(job);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedJob(null);
    };

    // No auto-refresh needed with CLI - manual refresh only

    onMount(() => {
        fetchJobs();
    });

    return (
        <ErrorBoundary>
            <div class="min-h-screen bg-gray-50">
                <Show when={currentPage() === 'dashboard'}>
                    <Header
                        onRefresh={fetchJobs}
                        onSettings={() => setCurrentPage('settings')}
                        onTemplates={() => setCurrentPage('templates')}
                        onProcess={() => setCurrentPage('process')}
                        isLoading={isLoading()}
                    />

                    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <Dashboard />

                        <JobsTable
                            jobs={jobs()}
                            isLoading={isLoading()}
                            error={error()}
                            onJobClick={handleJobClick}
                            onRefresh={fetchJobs}
                        />
                    </main>

                    <JobModal
                        job={selectedJob()}
                        isOpen={isModalOpen()}
                        onClose={closeModal}
                    />
                </Show>

                <Show when={currentPage() === 'settings'}>
                    <SettingsPage onBack={() => setCurrentPage('dashboard')} />
                </Show>

                <Show when={currentPage() === 'templates'}>
                    <TemplatesPage onBack={() => setCurrentPage('dashboard')} />
                </Show>

                <Show when={currentPage() === 'process'}>
                    <ProcessVideoPage onBack={() => setCurrentPage('dashboard')} />
                </Show>
            </div>
        </ErrorBoundary>
    );
};

export default App;
