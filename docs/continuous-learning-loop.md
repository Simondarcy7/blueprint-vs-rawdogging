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

Promote only:

- Rules likely to apply to at least two future projects.
- Practices that reduce setup mistakes.
- UX or engineering defaults that improve quality without overfitting.
- Checklists that would change future implementation behavior.

## Evidence and installation parity

For each promoted lesson, record source path and revision/date, whether it is committed or work in progress, observed behavior versus verified result, applicability, exceptions, and the smallest preventive check. Keep private data and product assets out of the toolkit.

Update the human guide and its corresponding installed skill reference together. Change kickoff/instruction templates when the lesson must influence future builds. Smoke-test installation into a disposable project for supported agents; also check `--no-docs` if skill references change. Existing installs skip existing directories by default, so review/merge updates rather than assuming a reinstall refreshed them.

Do not promote exact product budgets or vendor choices as universal rules. During framework/client migrations, inventory and revalidate earlier SEO, accessibility and performance checks. Prune stale or redundant rules before starting the next app.
