# Shell architecture

The shell owns navigation, appearance, shared controls and platform boundaries. The `notes` module is a replaceable example, not mandatory product functionality. It demonstrates one complete durable workflow.

| Boundary | Authority | Source |
| --- | --- | --- |
| Identity and palette | Brand configuration | `brand.json` |
| Typography | Registered bundled fonts and semantic roles | `src/config/fonts.ts`, `src/theme/tokens.ts` |
| Navigation | Router routes; module-owned screens | `src/app`, `src/modules/navigation` |
| Notes | Versioned document behind a typed storage adapter | `src/modules/notes/store.ts` |
| Appearance | Explicit preference; System resolves OS appearance | `src/theme/ThemeProvider.tsx` |
| Diagnostics | Allowlisted categories, no external provider until chosen | `src/services/diagnostics` |

Save flow: screen validates → module serializes operation → adapter writes one versioned document → store publishes the new snapshot → UI leaves the form. Failure leaves the draft and prior in-memory state intact. Duplicate presses are guarded. Unsupported or corrupt documents block writes; retry never clears data. Deletion uses the same durable boundary and requires a decision.

Native storage uses AsyncStorage; browser storage is per origin/profile. Neither is a credential vault or off-device backup. No account, sync, push, analytics or permission request is provisioned. The example is intended for modest local collections; benchmark realistic volume and multi-window requirements before adopting its whole-document storage for a larger product.

The root layout composes providers. Public support content has no notes-storage dependency. An emergency render boundary does not depend on theme or storage providers. Optional diagnostics cannot make recovery fail. Foreground transitions reload local notes through the same serialized queue; drafts remain local to the editor, protected by discard confirmation during navigation.

Web is a static Expo export. All application routes are noindex; `/support` becomes indexable only for an explicitly configured production origin. This policy is not access control. The shell has no service worker: an already-loaded page works with local data, but offline web reload is not promised.

Native binaries and OTA bundles are independent artifacts. Fingerprint runtime policy and explicit channels/environments are configured in `app.config.ts` and `eas.json`. Updates download for a later launch; the app does not reload during a form. A real project ID, native identity and signed-device verification are prerequisites for delivery, not starter defaults.

Update this map when authority, failure semantics or delivery compatibility change. Current validation belongs in `docs/verification.md`; product readiness belongs in the quality contract.
