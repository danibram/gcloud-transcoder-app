import { relaunch } from '@tauri-apps/plugin-process';
import { api } from './tauri';

export type AppUpdateStatus =
  | 'idle'
  | 'checking'
  | 'up-to-date'
  | 'available'
  | 'downloading'
  | 'installing'
  | 'disabled'
  | 'error';

export interface AppUpdateState {
  status: AppUpdateStatus;
  currentVersion?: string;
  version?: string;
  body?: string;
  contentLength?: number;
  downloadedBytes?: number;
  message?: string;
}

export async function checkForAppUpdate(): Promise<AppUpdateState> {
  try {
    const result = await api.appUpdateCheck();

    if (!result.configured) {
      return {
        status: 'disabled',
        message: 'Auto-update is enabled in the UI but not configured for this build.',
      };
    }

    if (!result.update) {
      return { status: 'up-to-date' };
    }

    return {
      status: 'available',
      currentVersion: result.update.currentVersion,
      version: result.update.version,
      body: result.update.body,
    };
  } catch (error) {
    if (isUpdaterDisabledError(error)) {
      return {
        status: 'disabled',
        message: 'Auto-update is enabled in the UI but not configured for this build.',
      };
    }

    return {
      status: 'error',
      message: toErrorMessage(error),
    };
  }
}

export async function installAppUpdate(
  onStateChange: (state: Partial<AppUpdateState>) => void,
): Promise<void> {
  onStateChange({
    status: 'installing',
    message: undefined,
  });

  await api.appUpdateInstall();
  await relaunch();
}

function isUpdaterDisabledError(error: unknown) {
  const message = toErrorMessage(error).toLowerCase();

  return (
    message.includes('does not have any endpoints set') ||
    message.includes('not configured for this build') ||
    message.includes('missing field `pubkey`') ||
    message.includes('missing field `endpoints`')
  );
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Unknown auto-update error';
}
