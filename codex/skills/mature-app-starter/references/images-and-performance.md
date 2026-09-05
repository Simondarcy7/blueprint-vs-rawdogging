# Images and performance

WebP is a useful default for photographic/illustrative app assets, but the reusable rule is to deliver the right visual at the right dimensions and byte cost. Choose SVG for suitable vectors; retain PNG/JPEG or evaluate AVIF when fidelity, transparency, tooling, or consumer support calls for it. Check the actual browser/native decoder and social/store asset requirements.

## Asset pipeline

1. Keep source assets separate from shipped derivatives. Record source, license/permission, attribution and allowed usage; a downloadable image is not automatically reusable.
2. Generate thumbnail, card and hero variants from the best available source. Resize without enlargement and inspect the result at its intended display size, including high-density screens.
3. Use deterministic filenames or a generated asset manifest, including dimensions and optional placeholders. Treat compression quality as an input to visual review, not a universal magic number.
4. Reserve layout space with width/height or aspect ratio. On web, use responsive sources/sizes where supported. On native, choose a variant for the actual view and device density.
5. Lazy-load offscreen images. Make the likely LCP image discoverable early and avoid lazy-loading it; use priority/preloading selectively after measuring.
6. Verify exported artifacts do not contain unused full-size originals, duplicate illustrations, tutorial assets, or unnecessary complete icon fonts.

## Budgets are project decisions

Record numeric budgets in `docs/app-quality-contract.md`: thumbnail/card/hero bytes, initial compressed JavaScript, font bytes, and the target device/network. Measure first, choose an achievable limit, and tighten it as the app matures. Check the built output in CI and measure the deployed page too; a small image cannot compensate for delayed rendering.

For uploads, also bound file bytes, decoded dimensions and pixel count before expensive processing; handle malformed inputs and retain a manual/retry path. Enforce limits on the server too when one receives the upload. Keep upload-processing limits separate from delivered-image budgets.

## Acceptance checks

- Thumbnails load thumbnail resources; small cards do not fetch every full-resolution hero.
- Missing/slow images have stable layout and useful fallback behavior.
- Critical imagery remains legible after compression, including crops and overlaid text.
- CI reports the actual failing asset and measured bytes, and fails when an expected artifact is missing.
- Production URLs return real assets after host rewrites/ignore rules; verify a representative image and font over HTTP.

References: [image loading](https://web.dev/articles/browser-level-image-lazy-loading) and [LCP optimization](https://web.dev/articles/optimize-lcp). Byte-budget checks and lab measurements supplement testing on representative devices and real-user measurements when available.

## Generated files have an owner and a check mode

For generated images, icon subsets or asset registries, document the source input, generator command, tool version and owned outputs. Sort inputs and use stable serialization. Record relevant source/output hashes or generator metadata so stale derivatives can be detected. A `--check` mode should fail with the exact regeneration command when expected files are missing or stale, without rewriting them during verification.

Keep the authoritative source separate from generated consumers; do not hand-edit both. Generate into temporary output and publish the set only after generation succeeds where partial writes could leave mismatched files. Prune stale outputs only inside explicitly generator-owned paths. State whether derivatives are committed or built in CI and verify a clean checkout can reproduce the chosen workflow.

For icon/font subsetting, account for names chosen dynamically through an explicit manifest or supported static convention. A source search alone may miss runtime names. Verify actual rendered glyphs against the original and check the shipped bundle for accidental full-font imports. Hash checks prove freshness/integrity, not visual correctness. Keep generator tools isolated and reproducible without imposing their runtime dependencies on the app.
