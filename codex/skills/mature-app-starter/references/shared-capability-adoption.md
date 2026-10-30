# Sharing product capabilities between applications

The four product workflow packs—drafts, import/review, interactions and engagement—can be vendored into an existing application's source tree with a small explicit sync command. They retain identical source bytes and local relative imports. The application does not import files from a sibling checkout at runtime.

## Install and verify

Run from the Blueprint checkout, using an explicit, dedicated consumer source directory:

```sh
node scripts/sync-product-capabilities.mjs --target "/absolute/consumer/src/foundation/blueprint" --dry-run
node scripts/sync-product-capabilities.mjs --target "/absolute/consumer/src/foundation/blueprint" --write
node scripts/sync-product-capabilities.mjs --target "/absolute/consumer/src/foundation/blueprint" --check
```

Exactly one mode is required. Dry-run and check never create directories or files. Write creates/updates only the selected canonical files and their manifest. This command does not wire routes, change application configuration, install dependencies, create accounts, publish or commit changes.

The resulting layout is:

```text
foundation/blueprint/
  .blueprint-product-capabilities.json
  lib/asyncWork.ts
  services/drafts/draftController.ts
  services/import-review/importReview.ts
  services/interactions/overlayFocus.ts
  services/engagement/promptPolicy.ts
```

Import through the application's own module alias or relative paths. Keep app-owned adapters, React wrappers, schemas, copy, themes, identity/lease checks and business rules outside this directory. Changes to shared code belong in Blueprint; local edits deliberately block subsequent automated updates.

## TypeScript and platform boundaries

Canonical `.ts` import extensions are preserved, including references to `../../lib/asyncWork.ts`. Consumers using TypeScript's `noEmit`/bundler workflow must support `allowImportingTsExtensions: true`; Golf App already declares it. A build that emits JavaScript must deliberately rewrite extensions using its existing supported compiler/bundler settings. The sync tool never silently rewrites source and hashes cannot conceal a consumer-specific transform.

These are portable TypeScript controllers and browser focus helpers. React Native applications must call browser-only interactions only from their web path. Installing them proves neither native UI accessibility nor storage/authorization integration; run the consumer's actual typecheck and relevant workflow tests after every adoption.

## Provenance and updates

The version-1 manifest records the fixed pack list, repository URL, observed Git revision (null for a source archive), `kind: working-tree`, a digest of the complete source map, and each destination's canonical source path plus SHA-256. The Git revision supplies context; file hashes identify the actual adopted bytes, including uncommitted work. This is provenance, not a signature or release approval. Commit the consumer sources and manifest together after review.

`--check` compares both the consumer against its recorded hashes and those hashes against today's canonical source. It reports missing/modified files, unexpected source removals and pending source changes. An unrelated Blueprint commit does not force a consumer update when the capability bytes remain unchanged.

An update is permitted only when every previously tracked consumer file still matches its recorded hash. Unknown files at any proposed destination, local modifications, local deletion, invalid manifests and symlink paths stop the entire preflight. Unrelated consumer files are preserved. Removed canonical files require a reviewed migration; this command does not delete them automatically.

For a shared fix:

1. Change the canonical capability and add the regression proving the behaviour.
2. Run its focused tests and each consumer's sync dry-run.
3. Apply the same source update to both consumers and run their integration checks.
4. Commit the canonical fix, both consumer source copies and their manifests. Keep donor/domain-specific fixes separate.
5. Run `--check` for both consumers to prove neither has drifted. Record the real workflow evidence alongside the hashes.

The test `tests/product-capability-sync.test.mjs` demonstrates one canonical change reaching two independent fixture consumers, drift detection, strict installed-layout compilation and preservation of local work. It is transport/mechanism evidence, not proof that two real products have adopted and exercised the capabilities.

## Failure handling

Run against a trusted, quiescent source/consumer tree. The command rejects symlinks anywhere in the supplied paths; use their real filesystem paths rather than aliases. A write lock excludes simultaneous sync writers. If a process crashes, inspect its changes before removing its stale `.blueprint-product-capabilities.lock` file.

The command rechecks existing hashes before replacing each file and writes the manifest last. File replacement is atomic per file; the whole directory is not a filesystem transaction. Disk failure or process interruption may leave a partial update. Inspect it against Git, restore the interrupted owned changes deliberately, then rerun. The tool will refuse unrecorded changed bytes rather than guessing whether they are user work. No claim is made to protect against a hostile process changing filesystem paths between checks.
