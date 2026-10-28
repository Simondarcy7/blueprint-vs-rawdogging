# Import, export and sharing

Use only for selected product capabilities. The toolkit's storage/device recipes provide boundaries and some validation/cleanup helpers; parsing, review screens, share cards and server links remain app-owned. Permission to process content does not automatically grant redistribution rights.

## Import is a staged workflow

| Stage | User-visible contract | Data boundary |
| --- | --- | --- |
| Choose or capture | Supported sources/formats, cancellation and manual alternative | Own only app-created temporary resources |
| Read/parse | Honest pending state, limits and useful failure | Treat file bytes and extracted content as untrusted |
| Review | Show extracted draft, uncertain/missing fields and corrections | No changes to current records yet |
| Validate | Explain identity, duplicate or compatibility conflicts | Validate the entire intended transaction |
| Confirm | Explain what will be created, merged or replaced | Deliberate commit using the application's authorization rules |
| Complete | Confirm actual saved outcome and next action | Clear temporary/draft state only at the correct success boundary |

Set limits for bytes, decoded dimensions, item counts, pages and processing time. Check actual content as well as extensions/MIME claims. Support cancellation during slow work; an obsolete parser result cannot repopulate a discarded draft. Keep failed imports from replacing valid current data. Where multi-record atomicity is unavailable, define staging and recovery explicitly.

## Scanning and AI-assisted extraction

Extracted values are suggestions until reviewed and validated. Preserve unknown values and show uncertainty where it affects the action. Do not invent confidence scores if the provider does not return a meaningful calibrated measure. Offer editing/manual entry and allow correction of identity as well as individual fields.

Keep instructions contained in imported documents as data, not authority to change application behaviour or invoke tools. Define provider data handling, retention and any user consent needed for remote processing. Avoid including raw user documents in diagnostics. Product-specific calculations and final validation remain independent of the extraction provider.

A demo should use clearly fictional or authorized sample material, be isolated from user records and allow a clean exit. Do not suggest a staged animation is evidence of real extraction speed or accuracy.

## Temporary resource ownership

Assign collision-resistant operation IDs and record which generated files each operation owns. Cancellation or failed creation should clean partial outputs without deleting the original user-selected file. Concurrent imports/exports cannot remove each other's resources. If cleanup fails, preserve the primary actionable error and retain a way to retry owned cleanup.

Do not assume a picker/share sheet has consumed a file merely because it opened. Follow the adapter's completion/lifetime contract. Keep resources available while the consumer requires them, then release them. Platform differences need explicit tests.

## Export and restore promises

List included collections, attachments, preferences, drafts and exclusions. Define schema/version, identity, timezone/units, credentials and whether the export contains sensitive data. Explain partial coverage; avoid calling an incomplete export a full backup.

Restore into an identified target. Validate identity/schema/size and every record before applying replacement. Define duplicate/merge policy, tombstones and incompatible/newer-format behaviour. Preserve existing data on failed validation. Reset selections, caches and undo history only when the new dataset becomes authoritative.

Verify representative export → clean-target restore → continued editing. Include missing credentials, corrupt files, interrupted commit and upgrade/rollback compatibility where promised. Keep local export, local recovery and remote backup as distinct mechanisms with distinct failure modes.

## Sharing and previews

Show the actual proposed share content before sending when privacy or interpretation warrants it. Default to the minimum information needed; names, locations, notes, identifiers and timestamps may need exclusion or explicit choice. The preview and generated file/link must agree. Honour theme/contrast and render long text, unknown values and non-Latin text without clipping.

Model unsupported, denied, cancelled, failed and handed-to-provider outcomes. Opening the share sheet is not proof of delivery. Provide an appropriate copy/download alternative when supported, and make failure recoverable without regenerating unrelated work.

For public links, define visibility, ownership, expiry, revocation and target changes. Enforce authorization server-side; an unguessable URL alone does not define access policy. Validate the destination and encode identifiers safely. A QR code needs a readable/copyable alternative. Link metadata and previews must obey the same privacy boundary as the page.

## Acceptance cases

- Cancel at each stage; temporary files are cleaned and current records are untouched.
- Import malformed, oversized, duplicate, ambiguous and future-version content.
- Edit an uncertain draft; a late extraction result cannot overwrite the correction.
- Fail a multi-record commit; verify the documented atomic/recoverable outcome.
- Share long/partial/private content; preview and actual output match the selected disclosure.
- Test unavailable share API, cancellation and temporary-file lifetime on intended platforms.
- Open expired, revoked, deleted and unauthorized links; every outcome is useful and enforced.

See [content trust](content-trust.md), [data resilience](data-resilience-and-capabilities.md), [forms](ui-states-and-forms.md) and [device recipes](portable-infrastructure.md).
