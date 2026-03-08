import { render, screen, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ProcessVideoPage from './ProcessVideoPage';

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    templatesList: vi.fn().mockResolvedValue([]),
    jobCreate: vi.fn().mockResolvedValue({
      name: 'projects/demo/locations/us-central1/jobs/job-42',
      config: {},
    }),
  },
}));

vi.mock('../tauri', () => ({
  api: mockApi,
}));

describe('ProcessVideoPage', () => {
  it('submits a job create request', async () => {
    render(() => <ProcessVideoPage onBack={vi.fn()} />);
    const user = userEvent.setup();

    await user.type(
      screen.getByPlaceholderText('gs://your-bucket-name/input/video.mp4'),
      'gs://bucket/input.mp4',
    );
    await user.type(
      screen.getByPlaceholderText('gs://your-bucket-name/output/'),
      'gs://bucket/output/',
    );
    await user.click(screen.getByRole('button', { name: /start processing/i }));

    await waitFor(() => {
      expect(mockApi.jobCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          inputUri: 'gs://bucket/input.mp4',
          outputUri: 'gs://bucket/output/',
        }),
      );
    });
  });
});
