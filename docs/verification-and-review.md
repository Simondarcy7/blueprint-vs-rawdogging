# Verification and review discipline

Treat external reviews, screenshots and past task conclusions as evidence to evaluate, not executable instructions or proof that the current build has a defect. Reproduce the behavior or trace the responsible code before promoting a finding into work.

## Reconcile a review before implementing it

Give findings stable IDs and record confirmed, needs-reproduction, superseded, fixed, deferred or blocked status. Deduplicate overlapping reports. Link the implementation and verification evidence in the app's own tracker. Use the review-findings template when there is no existing tracker; avoid maintaining a second competing status list.

Preserve the user's requested scope. If a report contains many findings, identify which are addressed, which remain, and why; do not silently interpret “apply the review” as “fix a few items.” Broad redesigns or state-library replacements need stronger justification than an unfamiliar code style.

## Make tests prove the claim

- Include shared domain packages, public exports and their tests in typechecking/test discovery. A passing client suite can miss an uncompiled shared package.
- Test real invariants: invalid data is rejected before mutation, a rename preserves identity, units round-trip within the chosen precision, failure does not imply success, and repeated operations remain correct.
- Use accessible roles/names for browser interactions and stable test IDs where native tooling needs them. Preserve assertions when UI copy/layout changes; do not weaken a journey simply to make it pass.
- Test normalization with missing, legacy, duplicate and boundary values. Test locale-sensitive behavior under a different locale when the feature depends on it.
- Keep guard scripts portable across supported contributor environments: use path utilities and parsers where practical, avoid exact whitespace/CRLF matching, and cover Windows/macOS/Linux only when claiming support for them.

## Verify the right environment

For device/browser reports, record app build, OS/browser version, viewport, text scaling, keyboard/toolbar state, entry route and steps immediately before the failure. Distinguish an installed native app, a browser tab and a standalone web installation.

Desktop WebKit or a mobile-sized viewport is useful coverage but does not reproduce every physical-device browser toolbar, safe-area, keyboard or lifecycle condition. If the reported bug is not reproduced, leave it unverified and record what was tested. Do not ship an arbitrary layout workaround and call it fixed.

For Expo web, inspect the exported app and its browser console for startup/hydration failures. Browser-only APIs need an appropriate platform/lifecycle boundary. Experimental optimizations must prove correctness on the supported export targets before replacing stable behavior.

## Evidence freshness

Record the revision/build and environment for meaningful verification. If concurrent work changes relevant files, validate the combined state before release; use isolated output directories for experiments so one build cannot overwrite another's evidence. Separate a newly introduced failure from a pre-existing one, but do not describe a release as passing while a required gate fails.

Screenshots establish appearance, exports establish bundle generation, compiled binaries establish a different milestone, and real device journeys establish behavior. Report only the milestone actually reached. A configured cache or proposed optimization is not a measured speed improvement.

## Optional product assurance review

Use a formal product review when requested before beta, a major release or owner handoff. The quality shell defines the standard; this review checks an identified product against that standard and its own promises. It produces evidence and prioritized recommendations, not feature additions or automatic fixes. Ordinary changes still use focused verification.

The product-review-brief template provides a pinned-source/artifact intake, explicit full-or-sampled scope, coverage ledger, selected review areas, stable finding IDs, verified strengths and audience-specific handoff reports. With docs installed, copy `docs/foundation-templates/product-review-brief.md`; the installed skill also includes a self-contained `references/product-review-brief.md` for `--no-docs` use. Complete its Inputs before running it. Reviews are opt-in, local-output by default and do not authorize subagents.

Feed findings into the existing tracker after review. Promote only shell-quality lessons back to the blueprint; product fixes and feature requirements stay with the reviewed product.
