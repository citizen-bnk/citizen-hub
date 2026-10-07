# Citizen Hub

The Hub for **hub.citizenbank.co.ls**: where Citizen Bank's own people do their work. Investors and shareholders hold and buy
shares; board members attend meetings, decide and supply licence documents; the back office runs subscriptions, certificates,
members, documents, communications and settings; administrators manage users and board positions. One sign-in, one
identity; each person sees only their own areas. Part of the
[Citizen Bank ecosystem](https://github.com/citizen-bnk/CitizenBankWebsite/blob/main/docs/ECOSYSTEM.md).

What it must do and why it is built this way: [`docs/HUB_FEATURES.md`](docs/HUB_FEATURES.md).
How to add or change a feature: [`docs/BUILDING_A_FEATURE.md`](docs/BUILDING_A_FEATURE.md).

## Shape of the code

```
src/platform/   the only shared code: API client + one error type, query client (reports every failure once),
                session and roles, the shell (navigation built from roles, role gate), small UI building blocks
src/features/   one folder per feature (portfolio, data-room, meetings, decisions, compliance, roster, subscriptions,
                certificates, people, settings, comms, account, home). A feature declares its screens, roles,
                navigation, old website addresses and Home tiles in feature.ts; the shell discovers it. Features never
                import each other. Delete a folder and the feature is gone.
src/components/ui/   the shadcn UI kit          src/index.css   the Internet Banking theme (dark and light)
```

Errors have one path: reads use `useQuery` shown through `PageState`; writes use `useAction`; failures are reported once by the
query client; a bug in a screen is caught by a boundary around that screen. Screens contain no try/catch or toast code, and a
test enforces it.

## Run

```bash
npm install
cp .env.example .env.local     # the Stack project values (the same project as the website)
npm run dev                    # http://localhost:5173; /api goes to a backend on :8000 (DEV_API_TARGET to change)
npm test                       # logic, registry/roles, error mapping, backend-route contract, structure rules
npm run test:render            # opens every screen as every demo role in a browser, API mocked from each feature's fixtures
npm run build
```

`npm test` includes a check that every backend call a feature makes names a route the backend serves
(`tests/backend-routes.json` is a snapshot of the backend's routes: refresh it when the backend changes).

## Seamless with the website

- The website redirects the addresses in `docs/hub-paths.json` (new paths and the old website addresses they replace) to the Hub
  when its `VITE_HUB_URL` is set; regenerate the file with `npm run export:paths` after changing a feature's screens.
- A signed-out visit goes to the website sign-in and straight back. With the shared session (Stack trusts
  `**.citizenbank.co.ls`) nobody sees a second login. On `*.vercel.app` hosts cannot share a session, so a visitor who returns
  still signed out is sent to the Hub's own `/demo` sign-in (a one-click picker of the demo accounts), never a loop.
- Addresses the Hub does not serve (privacy policy, contact...) go to the same address on the website.

## Publish on Vercel

1. Import this repository as a Vercel project (`vercel.json` sets the rest).
2. Environment variables: `VITE_STACK_PROJECT_ID`, `VITE_STACK_PUBLISHABLE_CLIENT_KEY` (or `AUTH_PROVIDERS`), `VITE_WEBSITE_URL`.
3. `vercel.json` forwards `/api/*` to the website backend: set that destination to the right environment (live or demo).
4. In Stack Auth, add the Hub's address as a trusted domain.
