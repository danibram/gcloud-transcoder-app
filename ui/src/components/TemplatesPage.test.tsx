import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TemplatesPage from './TemplatesPage';

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    templatesList: vi.fn(),
    templateCreate: vi.fn().mockResolvedValue({
      name: 'projects/demo/locations/us-central1/jobTemplates/new-template',
      config: {},
      labels: {},
    }),
    templateDelete: vi.fn().mockResolvedValue({
      ok: true,
      message: 'deleted',
    }),
  },
}));

vi.mock('../tauri', () => ({
  api: mockApi,
}));

describe('TemplatesPage', () => {
  beforeEach(() => {
    mockApi.templatesList.mockResolvedValue([
      {
        name: 'projects/demo/locations/us-central1/jobTemplates/existing-template',
        displayName: 'Existing Template',
        config: {},
        labels: {},
        createTime: '2026-03-01T00:00:00Z',
        updateTime: '2026-03-01T00:00:00Z',
      },
    ]);
    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  it('creates a template', async () => {
    render(() => <TemplatesPage onBack={vi.fn()} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /new template/i }));
    await user.type(screen.getByPlaceholderText('my-template'), 'new-template');
    const configInput = screen.getByPlaceholderText(
      '{"inputs": [], "elementaryStreams": [], "muxStreams": []}',
    );
    fireEvent.input(configInput, {
      currentTarget: {
        value: '{"inputs":[],"muxStreams":[]}',
      },
      target: {
        value: '{"inputs":[],"muxStreams":[]}',
      },
    });
    await user.click(screen.getByRole('button', { name: /^create$/i }));

    await waitFor(() => {
      expect(mockApi.templateCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'new-template',
        }),
      );
    });
  });

  it('deletes a template', async () => {
    render(() => <TemplatesPage onBack={vi.fn()} />);
    const user = userEvent.setup();

    await screen.findByText('existing-template');
    await user.click(screen.getByTitle('Delete template'));

    await waitFor(() => {
      expect(mockApi.templateDelete).toHaveBeenCalledWith('existing-template');
    });
  });
});
