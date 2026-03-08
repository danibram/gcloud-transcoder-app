import { render, screen, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SettingsPage from './SettingsPage';

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    settingsGet: vi.fn().mockResolvedValue({
      version: 1,
      googleCloud: {
        projectId: 'demo-project',
        location: 'us-central1',
      },
    }),
    settingsTestConnection: vi.fn().mockResolvedValue({
      ok: true,
      message: 'Connected as demo@example.com',
    }),
    settingsUpdate: vi.fn(async (settings) => ({
      version: 1,
      googleCloud: settings,
    })),
  },
}));

vi.mock('../tauri', () => ({
  api: mockApi,
}));

describe('SettingsPage', () => {
  it('tests and saves settings', async () => {
    render(() => <SettingsPage onBack={vi.fn()} />);
    const user = userEvent.setup();

    const projectInput = await screen.findByDisplayValue('demo-project');
    await user.clear(projectInput);
    await user.type(projectInput, 'updated-project');
    await user.click(screen.getByRole('button', { name: /save settings/i }));

    await waitFor(() => {
      expect(mockApi.settingsTestConnection).toHaveBeenCalledWith({
        projectId: 'updated-project',
        location: 'us-central1',
      });
      expect(mockApi.settingsUpdate).toHaveBeenCalledWith({
        projectId: 'updated-project',
        location: 'us-central1',
      });
    });
  });
});
