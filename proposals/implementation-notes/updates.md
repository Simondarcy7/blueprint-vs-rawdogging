# OTA startup capability: implemented extraction

## Source and preserved judgment

Donor: `Simondarcy7/golf-scoring-app`, inspected at `2b46b8d9ba4ccb71cf10cd099ed7ff8a686c46df` on 29 October 2026.

- `mobile/src/modules/app-updates/launchUpdate.ts`: bounded check/download, offline recovery, download now but apply only before interaction.
- `mobile/src/modules/app-updates/LaunchUpdateGate.tsx`: a six-second startup window shared across provider remounts, foreground-only reload.
- `mobile/src/modules/app-updates/launchUpdate.test.ts`: failure and late-download cases.

The new capability preserves those decisions and strengthens the session boundary: a completed startup, host `markInteractive()` call, cancellation or expired timer permanently closes reload eligibility. Multiple mounts use one controller and cannot run another attempt. A source-side remount issue is being handled separately; this extraction does not change the Golf App.

## Files and integration

The optional `updates` pack supplies `src/services/updates/launchUpdate.ts` and `expoAdapter.ts`. It uses the existing baseline `src/lib/asyncWork.ts`; it adds no runtime dependency or SDK configuration.

Create a single controller at native application bootstrap, outside component render/effects. Connect it to the application's existing `expo-updates` SDK and foreground state. For example, in an app-owned native bootstrap file:

```ts
import * as Updates from 'expo-updates';
import { AppState } from 'react-native';
import { createExpoUpdateAdapter } from './services/updates/expoAdapter';
import { createLaunchUpdateController } from './services/updates/launchUpdate';

export const launchUpdates = createLaunchUpdateController({
  adapter: createExpoUpdateAdapter(Updates),
  isActive: () => AppState.currentState === 'active',
});
```

In the existing root gate, use `useSyncExternalStore(launchUpdates.subscribe, launchUpdates.getSnapshot, () => 'ready')`. Start with `void launchUpdates.start()` in an effect; show the application's accessible opening surface for `waiting` and `reloading`, and show the app for `ready`. If the host exposes content through another path, call `markInteractive()` first. The `start()` promise tracks network work and must **not** be used as the UI readiness gate. A check/download may finish after the app is ready.

An ordinary component unmount only unsubscribes. Do not call `dispose()` on provider remounts; `cancel()`/`dispose()` end the entire launch session. An app-owned web variant should supply a disabled adapter without importing the native SDK. Branding, update notices, announcement priority and notice persistence remain host UX.

## Guarantees and limits

- Defaults: 6-second startup allowance, 15-second check deadline, 60-second download deadline. These are configurable product decisions, not platform requirements.
- Check/download timeout, rejection, disabled updates and no update open the application. Late downloads can complete for a future launch but cannot invoke reload after the gate closes.
- Cancellation settles controller work even when an adapter ignores its abort signal. Native SDK network work may continue independently; no late result can trigger this controller's reload.
- **An accepted native reload cannot be cancelled.** The controller invokes it only within the startup window while foregrounded. It keeps `reloading` visible if the promise never settles and does not expose interactive content on a reload timeout. A rejected reload returns to `ready`; a fulfilled promise stays `reloading` while the platform restarts. A host may provide a non-interactive recovery message, but must not imply that a timed-out native reload was cancelled.
- This adapter handles available new updates, following the donor's policy. It does not implement explicit rollback-to-embedded orchestration, runtime/channel configuration, update publishing, signing, compatibility verification or release approval.
- No Expo SDK/version pin was copied. The source app and starter may use different SDKs; validate the port against the adopting SDK. [Expo SDK 57 update documentation](https://docs.expo.dev/versions/v57.0.0/sdk/updates/) describes the update API and native reload semantics.

## Evidence

`node --test tests/updates-capability.test.mjs` checks the actual installed layout and strict TypeScript, concurrent/remounted callers, no-update remounts, hung checks/downloads, late results, foreground state, early interaction, disabled/expired sessions, provider failures, no-new download, cancellation/disposal, reentrant cancellation, pending reload safety, invalid options and the injected SDK mapping.

This is local controller/adapter contract evidence. It is not a signed iOS/Android update test, published OTA, device restart proof or complete product adoption. The next integration proof is a preview build receiving a compatible update, including offline launch and returning to an already-interactive root.
