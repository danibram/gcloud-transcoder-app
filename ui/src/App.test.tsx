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
  },
}));

vi.mock('./tauri', () => ({
  api: mockApi,
}));

describe('App', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockApi.jobsList.mockClear();
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
});
