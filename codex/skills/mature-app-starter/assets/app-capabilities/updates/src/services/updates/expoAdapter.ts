import type { UpdateAdapter } from './launchUpdate.ts';

/** Structural port for expo-updates; importing this file never loads or enables an SDK. */
export type ExpoUpdatesSdk = {
  readonly isEnabled: boolean;
  checkForUpdateAsync(): Promise<{ isAvailable: boolean }>;
  fetchUpdateAsync(): Promise<{ isNew: boolean }>;
  reloadAsync(): Promise<void>;
};

export function createExpoUpdateAdapter(sdk: ExpoUpdatesSdk): UpdateAdapter {
  const checkSignal = (signal: AbortSignal) => {
    if (signal.aborted) throw new Error('Update work cancelled');
  };
  return {
    enabled: sdk.isEnabled,
    check(signal) { checkSignal(signal); return sdk.checkForUpdateAsync(); },
    download(signal) { checkSignal(signal); return sdk.fetchUpdateAsync(); },
    reload: () => sdk.reloadAsync(),
  };
}
