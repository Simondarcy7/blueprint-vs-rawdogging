# Temporary dependency compatibility decisions

Reviewed 2026-09-05 for Expo 57.0.20 / Router 57.0.19. Revisit on each SDK/Router update, no later than 2026-10-05. These are narrow, tested overrides; do not copy them to unrelated dependency versions.

- `xcode → uuid` is pinned to 11.1.1 to address [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq). The Xcode parser uses `require('uuid').v4()`; the selected version preserves that CommonJS API. A test exercises the parser's generated identifier; native prebuild remains part of validation.
- `decode-uri-component` is pinned to 0.5.0 to address [GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr). Router's `query-string@7.1.3` expects a CommonJS function while the fixed decoder exports an ESM default. The local postinstall script changes exactly that import to `.default`, and refuses unfamiliar source/version. Node 22.13+ and Metro support this path. Tests cover decoding, repeated query values, malformed input and real Router navigation.

Remove the compatibility patch and override once the installed Router uses a compatible fixed decoder itself; run clean installation, query tests, web and native exports, and native project generation. Do not suppress audit findings globally or downgrade Expo to satisfy an automated audit fix suggestion.
