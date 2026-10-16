# Temporary dependency compatibility decisions

Reviewed during the 2026-10-17 refresh against the installed Expo SDK 57 / Router 57 lockfile. Revisit on each SDK/Router update and before external distribution. These are narrow, tested overrides; do not copy them to unrelated dependency versions.

- `xcode → uuid` is pinned to 11.1.1 to address [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq). The Xcode parser uses `require('uuid').v4()`; the selected version preserves that CommonJS API. A test exercises the parser's generated identifier; native prebuild remains part of validation.
- `decode-uri-component` is pinned to 0.5.0 to address [GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr). Router's `query-string@7.1.3` expects a CommonJS function while the fixed decoder exports an ESM default. The local postinstall script changes exactly that import to `.default`, and refuses unfamiliar source/version. Node 22.13+ and Metro support this path. Tests cover decoding, repeated query values, malformed input and real Router navigation.

Remove the compatibility patch and override once the installed Router uses a compatible fixed decoder itself; run clean installation, query tests, web and native exports, and native project generation. Do not suppress audit findings globally or downgrade Expo to satisfy an automated audit fix suggestion.

## Remaining upstream findings

The refresh applied compatible lockfile fixes with `npm audit fix`, removing the reported critical shell-quote finding and other fixable paths. The resulting audit still reports 19 high-severity affected packages, propagated from two underlying advisory families: `braces` (GHSA-vfj7-8cjw-p6xm) and `node-forge` (GHSA-86w9-cpqp-85rv). This count is a snapshot, not a permanent baseline or an acceptance waiver.

The automated force-fix suggestions downgrade Expo/React Native or expo-updates across incompatible major versions. They were not applied. Resolve or explicitly assess these paths against the intended runtime/build/update usage before distribution; do not describe this starter as security-cleared. Never feed untrusted patterns into affected build tooling. Re-run `npm audit` against the actual generated app and review upstream fixes rather than copying a broad vendor patch into every project.
