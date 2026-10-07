# Citizen subsystem experience rules

The public website provides information and routes users to the relevant subsystem. The Hub owns investor, shareholder, board and administration workflows. Banking systems own customer activity. Profile editing belongs within these systems and reads a shared identity with role-specific sections.

## Interaction rules

- Use the destination system's theme, navigation and language. Do not embed the website shell inside a subsystem.
- Open a single available workspace automatically. When a person has customer and Hub roles, keep a visible choice of services.
- Show existing information first. Prefill forms from the authoritative profile, allow corrections, and do not treat prefill as new verification evidence.
- Present one editable question at a time where this makes the task easier. Do not force separate steps for optional fields or already-completed information.
- Keep a clear primary action, back/cancel control and validation beside the relevant question. Keep entered values when navigating between steps.
- Financial submissions retain a review/confirmation stage; reducing clicks does not remove required approvals or identity checks.
- Use semantic labels, keyboard navigation, visible focus and readable error messages. Support zoom, narrow screens and long values without overlapping controls.
- Every sign-in screen offers a return to the public website. Users with multiple roles use one identity and see only authorized role compartments.

## Implemented in this migration

Hub pages and shared components use Hub theme tokens. Profile dialogs edit one item and reset from the latest stored value each time. Subscriber entry offers one active question with existing details summarized and optional items skippable. Banking profile pages show prefilled summaries with one active editor. Hub completion returns to Hub profile. Migrated pages/components are protected against being overwritten by the migration tool.

## Release verification still required

Build/type checks are prerequisites. Verify live sign-in, cross-system handoff, persisted profile updates, investor subscription completion, board and admin access, sign-out/website return and representative responsive sizes before declaring the ecosystem fully functional. Each complex workflow needs its own usability review; migration/theme changes alone do not constitute complete redesign of every process.
