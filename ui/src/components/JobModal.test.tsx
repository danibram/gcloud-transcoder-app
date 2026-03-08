import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vitest';
import JobModal from './JobModal';

vi.mock('../tauri', () => ({
  api: {
    settingsGet: vi.fn().mockResolvedValue({
      version: 1,
      googleCloud: {
        projectId: 'demo-project',
        location: 'us-central1',
      },
    }),
  },
}));

describe('JobModal', () => {
  it('copies debug request data to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    render(() => (
      <JobModal
        isOpen
        onClose={vi.fn()}
        job={{
          name: 'projects/demo-project/locations/us-central1/jobs/job-1',
          state: 'SUCCEEDED',
          inputUri: 'gs://bucket/input.mp4',
          outputUri: 'gs://bucket/output/',
          ttlAfterCompletionDays: 5,
          config: {
            muxStreams: [{ container: 'mp4', fileName: 'video.mp4' }],
            output: { uri: 'gs://bucket/output/' },
          },
        }}
      />
    ));

    fireEvent.click(
      screen.getByRole('button', { name: /debug info \(for google support\)/i }),
    );
    fireEvent.click(await screen.findByRole('button', { name: /copy json/i }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
    });
  });
});
