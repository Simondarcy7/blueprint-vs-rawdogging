# Screen behavior

- Screen / user purpose:
- Primary action / successful outcome:
- Route/deep link / access policy:
- Shell / title / navigation / Back behavior:
- Sticky header or action bar: useful here? Scroll owner, safe areas and focus offsets:
- State to preserve on return: filters, query, scroll position, draft:

| Applicable state | What the user sees | Action/recovery | Verification fixture |
| --- | --- | --- | --- |
| First load / loading shell | | | |
| Ready | | | |
| First-use empty | | | |
| No matching results | | | |
| Refresh / stale / partial | | | |
| Offline / capability unavailable | | | |
| Saving / success | | | |
| Error / validation failure | | | |
| Destructive / undo | | | |

Mark unused states N/A with a reason.

- Input validation / duplicate-submit handling:
- Persistence promise / retry / optimistic rollback:
- Keyboard / focus / screen-reader behavior:
- Motion purpose / arrival-change-exit / reduced-motion alternative / interruption behavior:
- Confirmation, undo and focus return; essential feedback that must remain visible:
- Narrow viewport / enlarged text / keyboard-open behavior:
- Slow device/network / realistic data-volume check:
- Outstanding gaps and next verification step:

## Interaction scope when motion is included

- Selected effects or deliberate static treatments; excluded/deferred effects:
- Existing component / token / animation owner:
- Semantic trigger and immediate committed/optimistic state:
- Rapid reversal, newer data, unmount and background behavior:
- Focus/input removal during exit and preference change mid-effect:
- Optional haptic/audio/celebration policy or N/A:
- Rendered timing/interruption evidence and platform gaps:

Use the motion-plan worksheet for a multi-screen pass; keep one source of decisions.
