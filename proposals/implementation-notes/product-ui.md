# Shared product UI extraction — 30 October 2026

## What is reusable

The `product-ui` pack is a complete React Native component family under `src/components/product-ui`, with one exported entry point. It turns Golf's mature screen, settings, loading, keyboard and navigation behaviour into usable themed source. It imports only React and React Native. Hosts supply colours, optional fonts and spacing through `ProductUIProvider`; Golf branding, icons, routing, lifecycle side effects and business logic stay with the application.

| Surface | Shared behaviour |
| --- | --- |
| `AppShell` | Side navigation on wide layouts, bottom navigation on compact layouts, selected/disabled destinations, labelled navigation landmark, web skip-to-main action, injected safe areas. The content tree retains identity while the layout changes. |
| `ScreenScaffold`, `ScreenHeader` | One scroll owner, direct in-flow sticky rail, footer outside scrolling content, back/close/action slots, large-text/narrow header layout, native input reveal and explicit keyboard policy. |
| `SettingsSection`, `SettingsRow` | Disclosure with removed collapsed controls, title/detail/value, one accessible interactive target, disabled/busy state, large-text wrapping and decorative icon slots. |
| `ActionButton`, `FormField`, `SearchField` | Synchronous duplicate-press guard, async busy and generic retry feedback, persistent labels, required/error associations, raw input retention, search clearing with input focus recovery. |
| `ChoiceGroup` | Controlled radio selection, explicit web ARIA state, roving focus, disabled-option skipping, Arrow/Home/End/Space support, nested-target handling, preserved modified shortcuts, imperative focus recovery. |
| `AsyncContent`, `RetryableContent` | Useful content retained through refresh/failure, delayed decorative skeleton, empty/retry states, fresh lazy-load attempt after retry, stale chunk attempts unable to replace newer attempts. |
| `AdaptiveColumns`, `ProductText` | Measured responsive width, large-text thresholds, stable pane identity, scaling typography and heading semantics. |

This complements the baseline's lightweight primitives and existing Presence/motion support. It does not introduce another animation engine or replace a host's specialised branded visual components.

## Host contract and example

Use a single `ProductUIProvider` above the shared shell/workflows. Map existing application theme tokens to `background`, `surface`, `text`, `muted`, `border`, `accent`, `onAccent`, `danger` and `focus`. Defaults are radius 12, gutter 20 and content maximum width 960. The host owns theme contrast and any focusable content supplied through slots.

```tsx
<ProductUIProvider theme={applicationTheme}>
  <AppShell
    navigation={[{ key: 'home', label: 'Home' }, { key: 'settings', label: 'Settings' }]}
    activeKey={routeKey}
    onNavigate={navigate}
    insets={safeAreaInsets}
  >
    <ScreenScaffold header={<ScreenHeader title="Settings" />}>
      <SettingsSection title="Appearance">
        <ChoiceGroup label="Theme" options={themeOptions} value={theme}
          onChange={setTheme} />
      </SettingsSection>
    </ScreenScaffold>
  </AppShell>
</ProductUIProvider>
```

- Supply safe area insets to exactly one owner. An inset-owning `AppShell` normally contains zero-inset screens. When a host tab bar owns bottom safe area, use `bottomInsetHandledByHost` on a standalone scaffold. No safe-area package or platform configuration is silently installed.
- A scaffold defaults to one scroll view. Use `scroll={false}` when a child virtualised list owns scrolling. Do not put a list with independent scrolling inside the default scaffold scroll view. The footer remains a sibling and cannot cover the final input.
- Native keyboard reveal only follows the actual focused input, cleans up scheduled frames/listeners and leaves web focus scrolling to the browser. iOS keyboard avoidance defaults on; Android normally relies on the host's window resize policy, with explicit opt-in available. Custom app keyboard wrappers must coordinate ownership.
- Navigation supplies callbacks rather than a routing dependency. Stable route content, authentication gates, modal orchestration and provider lifetimes remain host responsibilities. Back and close actions are labelled host-provided slots.
- `ChoiceGroup` uses stable unique string values. `focusSelected()` and `focusOption(value)` let a workflow recover focus after removing a transient action. Option accessibility labels can expand abbreviated visible labels.
- Action locking is local to the mounted button. It does not replace controller deduplication, owner fencing or server idempotency. A resolved domain failure is interpreted by the workflow/controller; only a thrown/rejected handler produces the generic button failure message. The host supplies safe product-specific error copy, never raw server details.
- Pass `hasContent` when refreshing useful content so form and list identity survive loading/error transitions. Skeleton slots must be decorative; the pack hides them from accessibility, pointer input and web keyboard focus. Reset `RetryableContent` with `resetKey` when its resource scope changes.

## Source provenance

Reviewed Golf checkout HEAD: `bf2210235e1f091afc7f4bbc15ba2baa6c3a50f6`. The following hashes identify inspected working-tree bytes captured on 30 October 2026; concurrent Golf adoption is recorded separately. No Golf file was edited by this pack's author.

| Donor path | SHA-256 |
| --- | --- |
| `mobile/src/components/ui.tsx` | `762a612f9311eb54f957d652db59719df660dc366eb185f840db9d6a4d6e8a73` |
| `mobile/src/modules/navigation/layouts/AppShell.tsx` | `a79ecc77ec8e629bc82aa33bbcb708f5aded2be92fc0f0611ef1a9c2ed0e20f0` |
| `mobile/src/components/NavigationRow.tsx` | `b170afa5bcda88af1782547e6a569c87456d35136b00adfa3931d2331791338c` |
| `mobile/src/modules/settings/screens/SettingsScreen.tsx` | `67022982168f9a2dac8cd1f2ad53f5c51383d95f92042c5611e79d3e75f03793` |
| `mobile/src/components/ResponsiveColumns.tsx` | `eb0f017ddd1f9eba7d5d4e235345b4131fdb4ba923077bc67158a38ff195087a` |
| `mobile/src/components/DelayedSkeleton.tsx` | `796b344919ba09c3db23d6db9efaf9af0fb38003c5c3464b2322857f1ae3c58c` |
| `mobile/src/components/RetryableContent.tsx` | `15457d6892dbf201ab73484991cca9f424330d25e7c316cf1343ac9ecb623323` |

The source review also used focused tests for Screen footer behaviour, ChoiceGroup keyboard navigation, AdaptiveColumns and delayed skeletons. Specialised SwiftUI columns and Golf's native/tab/router provider stack were inspected selectively and retained in the host rather than copied into this dependency-free pack. These components are behaviour-grounded extraction, not byte-identical copies of the donor.

## Verification and limits

`node --test tests/product-ui-capability.test.mjs`: **19 passing tests**. The suite exercises the copied installed layout, duplicate async actions, teardown, raw input/error semantics, search focus recovery, radios and keyboard/ARIA state, settings disclosure, cached content identity, decorative skeleton delay, retry/stale lazy loads, responsive state retention, shell navigation/skip-to-main, direct sticky rail, footer ownership and native focused-input cleanup.

The pack also compiles against the actual installed declarations for **React Native 0.83.6 and 0.88.0**, using each package's exported types, under `strict` and `noUncheckedIndexedAccess`: **zero diagnostics for both**. Component refs derive their instance type from the component rather than assuming the older class shape. The web-only keyboard boundary accommodates the native event type difference without changing DOM behaviour. The renderer harness uses mocked native primitives to make state, callback and lifecycle assertions; it does not establish browser geometry, real keyboard avoidance or native screen-reader behaviour. Parent verification runs the generated Expo starter and actual consumer projects separately.

The generated starter browser review caught React Native Web omitting `accessibilityState.checked`; the canonical components now supply explicit ARIA checked/disabled/busy states while retaining native accessibility state. A controlled-selection regression covers the correction. Physical-device safe areas, keyboard behaviour and assistive-technology acceptance remain host/device checks.
