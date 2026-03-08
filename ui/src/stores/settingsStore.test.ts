import { describe, expect, it, vi } from 'vitest';

const mockApi = {
  settingsGet: vi.fn().mockResolvedValue({
    version: 1,
    googleCloud: {
      projectId: 'demo-project',
      location: 'us-central1',
    },
  }),
  settingsUpdate: vi.fn(async (settings) => ({
    version: 1,
    googleCloud: settings,
  })),
};

vi.mock('../tauri', () => ({
  api: mockApi,
}));

describe('settingsStore', () => {
  it('loads settings from native config', async () => {
    const store = await import('./settingsStore');
    await store.loadSettings();

    expect(mockApi.settingsGet).toHaveBeenCalled();
    expect(store.settings()).toEqual({
      projectId: 'demo-project',
      location: 'us-central1',
    });
  });

  it('saves settings through the tauri bridge', async () => {
    const store = await import('./settingsStore');
    await store.saveSettings({
      projectId: 'next-project',
      location: 'europe-west1',
    });

    expect(mockApi.settingsUpdate).toHaveBeenCalledWith({
      projectId: 'next-project',
      location: 'europe-west1',
    });
    expect(store.settings()).toEqual({
      projectId: 'next-project',
      location: 'europe-west1',
    });
  });
});
