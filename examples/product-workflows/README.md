# Product workflow reference

Run from the repository root:

```sh
npm ci
npm run example:ux
```

Open the printed localhost URL. Port 8769 is stable by default so drafts survive server restarts in the same browser profile. Use `npm run example:ux -- --port 8770` if needed; changing the port changes the browser storage origin. Stop with Ctrl+C to remove the owned temporary build. `npm run example:ux:check` performs a strict compile without serving.

The journal demonstrates the actual draft, import-review, interaction and engagement capability sources. It has no remote services or real accounts. Draft input and the imported collection are deliberately separate. A replacement import always needs a review and explicit confirmation. The failure switches demonstrate retaining work and retrying after an uncommitted failure.

Integration contracts and installation commands: [product workflow capabilities](../../docs/product-workflow-capabilities.md). Verification evidence: [phase 2 execution record](../../proposals/implementation-notes/phase-2-summary.md).
