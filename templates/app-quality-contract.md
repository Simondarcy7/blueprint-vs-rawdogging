# App quality contract

Complete at kickoff; update when decisions or release evidence change. `Pending` means not implemented or not verified. N/A needs a reason. Replace example commands with commands that actually exist.

## Product and surfaces

- Product / target users:
- First valuable workflow / success signal:
- Explicit non-goals:
- Platforms and representative devices/browsers:
- Public route allowlist / rendering approach:
- Private routes / access boundary:
- Production origin / preview indexing policy:
- Data collected / storage / retention / export-delete needs:

## Core shell acceptance

Verify these for the selected platforms and existing surfaces. A check is not an instruction to create another feature. For example, navigation checks do not require tabs, appearance checks do not require a theme picker, and SEO checks do not require a marketing site.

| Concern | App decision or numeric limit | Real command / manual procedure | Status / evidence |
| --- | --- | --- | --- |
| Expo/Router structure, thin routes and module boundaries | | | Pending |
| Shared primitives, theme tokens, typography and clear copy | | | Pending |
| Shell layout, safe areas, responsive sizing and keyboard behavior | | | Pending |
| Navigation, Back/deep links and focus on existing routes | | | Pending |
| Applicable loading, empty, error and recovery states | | | Pending |
| Keyboard/screen reader, contrast, enlarged text and reduced motion | | | Pending |
| First useful workflow and representative initial content | | | Pending |
| Centralized config, environment separation and secret handling | | | Pending |
| Public/private route policy; SEO on public web content | | | Pending |
| Image dimensions, formats, bytes and layout stability | | | Pending |
| JavaScript/font budgets and measured startup/runtime performance | | | Pending |
| Typecheck, lint, structural check and relevant behavior tests | | | Pending |
| Data minimization and sanitized error diagnostics | | | Pending |
| Release identity and verification on supported surfaces | | | Pending |

## Selected product capabilities

Add rows only for capabilities required by this product brief. Keep detailed criteria in the relevant feature specification and link them here. Leave this table empty until scope is selected; do not generate capabilities from the reference library.

| Selected capability / scope reference | Additional acceptance checks | Real command / manual procedure | Status / evidence |
| --- | --- | --- | --- |

## Release record

- Commit/build and environment:
- CI results and manual evidence:
- Outstanding gaps, owner and next action:
- Rollback procedure:
- Accepted exceptions, reason and revisit trigger:

## Learning to carry forward

- Repeated problem and source evidence (committed / work in progress):
- General rule and applicability to another app:
- Smallest check or template change that prevents recurrence:
- Toolkit location to update:
