# Building a Hub feature

A feature is a folder in `src/features/<id>/`. The shell discovers `feature.ts` automatically and builds the routes, the side
navigation, the role gate and the Home tiles from it. Delete the folder and the feature is gone. Nothing else needs editing.

```
src/features/meetings/
  feature.ts      the contract: screens, roles, navigation, legacy addresses, Home tiles   (required)
  api.ts          types and one function per backend call, using `api` from the platform
  hooks.ts        useQuery/useAction wrappers (optional, when several screens share them)
  pages/          one file per screen (default export), small; split big ones into components/
  components/     pieces used by this feature only
  logic.ts        pure functions (totals, status rules, validation) - unit tested
  logic.test.ts   node:test, runs with `npm test`
  fixtures.ts     API responses for the render test (`export default { "GET /api/x": {...} }`)
```

## Rules

1. **Features never import other features.** Share through `@/platform/*` only. If two features need the same thing, it belongs in
   the platform (ask), or each keeps its own small copy.
2. **One error approach.** Screens contain no `try/catch`, no `toast.error`, no `console.error`, no `alert`.
   - Reads: `useQuery` with `api.get(...)`, shown with `<PageState query={q} empty="...">{(data) => ...}</PageState>`.
   - Writes: `useAction(fn, { success: "Saved", refresh: [["meetings"]] })`; failure is reported once by the query client.
   - A form that shows field messages itself: `useAction(fn, { silent: true })` and read `action.error?.fields`.
   - Downloads: `useDownload((id) => api.file(path))`.
   - A real bug in your screen is caught by the shell's boundary; do not write your own.
3. **No role checks inside screens.** Declare `roles` on the feature or screen; the shell gates it. A screen may *hide a button*
   by role with `useSession().roles` and `allowed(...)` when one screen serves two roles.
4. **The backend is the truth.** Read `/home/user/CitizenHub/backend/app/apis/<module>/__init__.py` for every route you call: its
   path (mounted under `/api`), method, parameters, body and response shape. Never call something that does not exist; if the
   backend lacks what a screen needs, leave that action out and say so in your final report.
5. **API paths are string literals** in `api.get("/meetings/...")` style (template literals with `${}` for ids), without the
   `/api` prefix, so a test can check them against the backend's route list.
6. **Small files.** A screen file over ~250 lines should be split. Prefer a list plus a `Drawer` for detail over extra pages.
7. **Lean UI.** Use `@/platform/ui/kit` (PageHeader, Panel, Stat, Status, DataTable, Field, Confirm, Drawer), the shadcn parts in
   `@/components/ui/*`, and Tailwind theme tokens (`bg-card`, `text-muted-foreground`, `border`). No hard-coded colours.
   Forms: controlled inputs plus a small `zod` schema in `logic.ts`; show messages beside fields. Money/dates: `@/platform/format`.
8. **Accessible by default**: labelled fields, buttons that are buttons, keyboard-operable rows, readable at 360px width.

## feature.ts

```ts
import { defineFeature } from "@/platform/feature";
import { WHO } from "@/platform/auth/roles";

export default defineFeature({
  id: "meetings",
  section: "board",                       // home | invest | board | office | admin | account
  roles: WHO.boardAndOffice,              // who may open its screens (super_admin always may)
  screens: [
    { path: "/meetings", title: "Meetings", load: () => import("./pages/MeetingList"), nav: {},
      legacy: ["/board-meetings"] },
    { path: "/meetings/:meetingId", title: "Meeting", load: () => import("./pages/Meeting"),
      sample: { meetingId: "m1" },
      legacy: ["/meeting-details"], fromLegacy: (q) => (q.get("id") ? `/meetings/${q.get("id")}` : null) },
    { path: "/office/meetings/new", title: "New meeting", section: "office", roles: WHO.office, load: ... },
  ],
  widgets: [{ id: "next-meeting", roles: WHO.board, load: () => import("./widgets/NextMeeting"), order: 20 }],
});
```

`WHO`: investors, board, office, admins, investorsAndBoard, boardAndOffice, staff (office+admin), everyone.
`nav: {}` lists a screen in the navigation (`nav: { group: "People" }` under a sub-heading); omit it for detail and wizard screens.
A screen may set its own `section` and `roles` (a member's view under Board, the staff view under Back office).
Use paths under `/office/...` for back-office screens and `/admin/...` for administration.

## fixtures.ts and the render test

`npm run test:render` builds the app with sign-in stubbed, opens every screen as every demo role (customer, investor,
shareholder, board, staff, admin, combined), and fails on any page error, any API call without a fixture, a screen that should be
open but is gated, or one that should be gated but opens. Provide a fixture for every GET your screens make on load:

```ts
export default {
  "GET /api/board-meetings/list": [{ id: "m1", title: "Q4 meeting", ... }],
  "GET /api/board-meetings/:id": { id: "m1", ... },     // :name matches one path segment, * matches the rest
} as Record<string, unknown>;
```
Fixture data should be realistic (taken from the backend's response models) so screens render fully, not as empty states.
Run only yours with `node --import tsx tests/render.mjs --feature <id>` and look at screenshots with `--shots /tmp/x`.

## Checks before you stop

`npx tsc --noEmit` (no errors), `npm test`, `node --import tsx tests/render.mjs --feature <id>`. Do not edit files outside your
feature folders, do not commit, do not run `npm install`.
