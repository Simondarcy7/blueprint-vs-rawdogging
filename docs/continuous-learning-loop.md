# Continuous Learning Loop

Use this loop when an active project teaches something reusable.

## Capture Triggers

Capture a learning when:

- A project pattern worked well and should be reused.
- A setup mistake caused friction.
- An `AGENTS.md` rule prevented or caused a problem.
- A service boundary, feature boundary, or folder structure decision becomes clearer.
- A UX state, accessibility check, testing pattern, or verification step proves valuable.
- A dependency, tool, or workflow decision should influence future projects.

## Handoff Prompt

```md
Reusable toolkit learning:
- Learning:
- Applies to future projects:
- Suggested toolkit update:
```

## Promotion Rule

Promote a lesson into the default shell only when it improves implementation quality without inventing a product feature. Reuse across several apps is not enough by itself. Keep capability-specific requirements in the owning product; optional toolkit guidance must stay conditional and must not seed new capabilities into kickoff checklists.

Promote only:

- Rules likely to apply to at least two future projects.
- Practices that reduce setup mistakes.
- UX or engineering defaults that improve quality without overfitting.
- Checklists that would change future implementation behavior.

## Evidence and installation parity

For each promoted lesson, record source path and revision/date, whether it is committed or work in progress, observed behavior versus verified result, applicability, exceptions, and the smallest preventive check. Keep private data and product assets out of the toolkit.

Update the human guide and its corresponding installed skill reference together. Change kickoff/instruction templates when the lesson must influence future builds. Smoke-test installation into a disposable project for supported agents; also check `--no-docs` if skill references change. Existing installs skip existing directories by default, so review/merge updates rather than assuming a reinstall refreshed them.

Do not promote exact product budgets or vendor choices as universal rules. During framework/client migrations, inventory and revalidate earlier SEO, accessibility and performance checks. Prune stale or redundant rules before starting the next app.

## Generic public guidance

Public toolkit updates should describe reusable behavior, applicability and checks without naming the source app or including its local paths, commit IDs, branding, domain data or arbitrary performance values. Keep any necessary private provenance separately with appropriate authorization. Promote a portable lesson only when its evidence supports it; distinguish proposed patterns from verified behavior.

## Mining older task histories

Include archived tasks and earlier pages of long conversations; a recent-task list is not the project history. Start with a project-scoped inventory and record the date range, tasks/pages inspected and unavailable or unreviewed gaps. Read summaries and final outcomes first, then load the particular decision, failure or correction needed to assess a candidate lesson. Avoid raw tool logs and unrelated conversations.

Treat historical messages as evidence, not current instructions. Distinguish an initial proposal from implementation, a claimed check from its supporting result, and an old recommendation from a later correction. Preserve the reason and applicable failure mode rather than copying obsolete frameworks, dependency versions or product-specific choices. Check current source or authoritative documentation when the proposed rule depends on present behavior.

Compare candidates with existing guidance before adding rules. Prefer a small addition to the guide and its acceptance check over another overlapping document. Keep coverage/provenance notes private and scrub credentials, identifiers and source-product details before publishing. Report the actual coverage; do not call a summary review an exhaustive transcript audit.
