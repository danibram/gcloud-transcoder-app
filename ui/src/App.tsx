import { Component, createSignal, onMount, Show } from 'solid-js';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import JobModal from './components/JobModal';
import JobsTable from './components/JobsTable';
import ProcessVideoPage from './components/ProcessVideoPage';
import SettingsPage from './components/SettingsPage';
import TemplatesPage from './components/TemplatesPage';
import { api } from './tauri';
import { TranscoderJob } from './types';

const App: Component = () => {
    const [jobs, setJobs] = createSignal<TranscoderJob[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [error, setError] = createSignal<string | null>(null);
    const [selectedJob, setSelectedJob] = createSignal<TranscoderJob | null>(null);
    const [isModalOpen, setIsModalOpen] = createSignal(false);
    const [currentPage, setCurrentPage] = createSignal<'dashboard' | 'settings' | 'templates' | 'process'>('dashboard');
    const [pageSize, setPageSize] = createSignal(50);
    const [currentPageNum, setCurrentPageNum] = createSignal(1);
    const [totalJobs, setTotalJobs] = createSignal<number | undefined>(undefined);
    const [hasNextPage, setHasNextPage] = createSignal(false);
    const [searchTerm, setSearchTerm] = createSignal('');
    let searchTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleSearchChange = (term: string) => {
        setSearchTerm(term);

        // Clear existing timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        // Debounce search - wait 500ms after user stops typing
        searchTimeout = setTimeout(() => {
            setCurrentPageNum(1);
            fetchJobs(1, pageSize(), term);
        }, 500);
    };

    const fetchJobs = async (page: number = 1, size: number = pageSize(), search: string = searchTerm()) => {
        try {
            setIsLoading(true);
            setError(null);

            const result = await api.jobsList({
                pageSize: size,
                pageNumber: page,
                searchTerm: search
            });

            setJobs(result.jobs);
            setTotalJobs(result.totalSize);
            setHasNextPage(!!result.nextPageToken);
            setCurrentPageNum(page);
            setPageSize(size);
        } catch (err) {
            console.error('Error fetching jobs:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch transcoder jobs');
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
                        onRefresh={() => {
                            setCurrentPageNum(1);
                            fetchJobs(1, pageSize(), searchTerm());
                        }}
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
                            onRefresh={() => {
                                setCurrentPageNum(1);
                                fetchJobs(1, pageSize(), searchTerm());
                            }}
                            currentPage={currentPageNum()}
                            pageSize={pageSize()}
                            totalJobs={totalJobs()}
                            hasNextPage={hasNextPage()}
                            onPageChange={(page) => fetchJobs(page, pageSize(), searchTerm())}
                            onPageSizeChange={(size) => {
                                setCurrentPageNum(1);
                                fetchJobs(1, size, searchTerm());
                            }}
                            searchTerm={searchTerm()}
                            onSearchChange={handleSearchChange}
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
