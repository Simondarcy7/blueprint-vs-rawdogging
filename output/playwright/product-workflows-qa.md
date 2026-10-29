# Product workflows browser verification — 29 October 2026

Local Chromium automation through the Playwright CLI, owned session `blueprint-ux`. The actual capability modules were compiled by `npm run example:ux` into an owned temporary directory. Final server origin: `http://127.0.0.1:8769`.

| Scenario | Observed outcome |
| --- | --- |
| Save and reload draft | Title/body retained with a truthful saved label |
| Type while hydration is pending | Stored draft was offered for explicit recovery; saving stayed disabled until Keep my edits was chosen; save/reload then succeeded |
| Inject storage-write failure | Current input retained; retry after disabling the failure switch saved successfully |
| Inject a one-time draft-read failure | Explicit Retry loading draft recovered without clearing stored or live input |
| Stage valid import | Review shown; collection unchanged until explicit confirmation |
| Inject uncommitted import failure | Existing collection preserved; same review retained; retry committed two entries |
| Malformed JSON | Rejected before commit; existing two-entry collection retained |
| Change source after review | Previous review invalidated and confirmation unavailable |
| Open/cancel discard dialog | Focus returned to its invoking discard control |
| Navigate away and back | Saved draft retained and controls remained usable; this does not establish that the browser actually selected BFCache |
| 390 × 844 mobile / reduced motion | No horizontal overflow; final document client/content widths both 375 px inside a 390 px viewport with its vertical scrollbar; visible button heights at least 44 px; reduced-motion media query active |
| Final console | Zero errors and zero warnings |

Desktop (1360 × 1050) and mobile captures were inspected. The early first-build favicon 404 was fixed before the final zero-error check. The demo's persisted `pagehide` lifecycle fix is supported by code review plus navigation acceptance; actual BFCache usage was not instrumented. The drafts accessor/ownership edge cases are separately covered by focused controller regressions.

After the final controller corrections the server was rebuilt and draft reload, explicit late-load recovery, review without writes, dialog focus restoration and mobile overflow checks were repeated successfully. The first smoke script attempted save during unresolved recovery and timed out on the correctly disabled button; choosing Keep my edits completed the intended recovery path without changing application code. A subsequent equality-based viewport assertion incorrectly treated the vertical scrollbar gutter as overflow; comparing document content width with document client width confirmed no horizontal overflow. Neither test-script issue required an application change.

- [Desktop capture](product-workflows-desktop.png)
- [Mobile full-page capture](product-workflows-mobile.png)
- [Mobile viewport capture](product-workflows-mobile-viewport.png)

No native devices, real accounts, server transactions, third-party provider transports or screen-reader announcements were tested. This is a local reference integration, not evidence of a shipping second consumer. Browser and server cleanup is recorded in the phase 2 execution report. Re-run with `npm run example:ux`.

Cleanup verification exposed npm signal forwarding interrupting asynchronous build deletion. The server shutdown was fixed, a process-level regression reproduced the failure then passed, and the four known pre-fix build directories were removed explicitly. This change affects server teardown only, not the browser modules exercised above.
