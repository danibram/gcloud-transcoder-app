import { render, screen, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import App from './App';

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    settingsGet: vi.fn().mockResolvedValue({
      version: 1,
      googleCloud: {
        projectId: 'demo-project',
        location: 'us-central1',
      },
    }),
    jobsList: vi.fn().mockResolvedValue({
      jobs: [
        {
          name: 'projects/demo/locations/us-central1/jobs/job-1',
          state: 'SUCCEEDED',
          inputUri: 'gs://input.mp4',
          outputUri: 'gs://output/',
          createTime: '2026-03-01T10:00:00Z',
          config: {},
        },
      ],
      totalSize: 1,
      nextPageToken: undefined,
    }),
    appUpdateCheck: vi.fn().mockResolvedValue(null),
    appUpdateInstall: vi.fn().mockResolvedValue(undefined),
  },
}));

const { mockRelaunch } = vi.hoisted(() => ({
  mockRelaunch: vi.fn(),
}));

vi.mock('./tauri', () => ({
  api: mockApi,
}));

vi.mock('@tauri-apps/plugin-process', () => ({
  relaunch: mockRelaunch,
}));

describe('App', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockApi.jobsList.mockClear();
    mockApi.appUpdateCheck.mockReset();
    mockApi.appUpdateCheck.mockResolvedValue({ configured: false, update: null });
    mockApi.appUpdateInstall.mockReset();
    mockApi.appUpdateInstall.mockResolvedValue(undefined);
    mockRelaunch.mockReset();
    mockRelaunch.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('loads jobs on mount and debounces search', async () => {
    render(() => <App />);

    await screen.findByText('job-1');
    expect(mockApi.jobsList).toHaveBeenCalledWith({
      pageSize: 50,
      pageNumber: 1,
      searchTerm: '',
    });

    const input = screen.getByPlaceholderText('Buscar por Input URI o Output URI...');
    await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).type(input, 'needle');
    await vi.advanceTimersByTimeAsync(500);

    await waitFor(() => {
      expect(mockApi.jobsList).toHaveBeenLastCalledWith({
        pageSize: 50,
        pageNumber: 1,
        searchTerm: 'needle',
      });
    });
  });

  it('offers an install action when an update is available', async () => {
    mockApi.appUpdateCheck.mockResolvedValue({
      configured: true,
      update: {
        currentVersion: '1.0.0',
        version: '1.1.0',
        body: 'Bug fixes',
      },
    });

    render(() => <App />);

    const installButton = await screen.findByRole('button', { name: 'Install 1.1.0' });
    await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(installButton);

    expect(mockApi.appUpdateInstall).toHaveBeenCalled();
    expect(mockRelaunch).toHaveBeenCalled();
  });
});
