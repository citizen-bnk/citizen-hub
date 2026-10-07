# Citizen Hub

The Citizen Hub frontend for **hub.citizenbank.co.ls**: the entry point for investors, shareholders, the board and the
back office of Citizen Bank. Part of the [Citizen Bank ecosystem](https://github.com/citizen-bnk/CitizenBankWebsite/blob/claude/practical-volta-tqe0qk/docs/ECOSYSTEM.md).

## Status (version 0.2.0): the investor and board portals live here

The investor and board screens are carved out of the website into this repo and look like Internet Banking
(dark indigo glass, violet-to-coral gradient, light variant via the header toggle):

| Path | Screen |
|---|---|
| `/` | Hub home: opens your workspace directly if you only have one |
| `/my-subscriptions` | My investments: subscriptions, certificates, receipts, transfers |
| `/board-portal`, `/board-documents`, `/board-meetings`, `/meeting-details` | Board portal |

**Seamless sign-in.** Signing in on the website with an investor or board role lands here with no second login when the
Stack project trusts the parent domain (`**.citizenbank.co.ls`, so the session cookie is shared). A signed-out visit sends
the person to the website sign-in and back. Any path the Hub does not own redirects to the same path on the website. On
`*.vercel.app` (a public suffix) the shared cookie is not possible: a visitor who comes back from the website still signed out is
sent to the Hub's own `/demo` page (a one-click picker of the demo accounts that open the Hub, or the normal Stack form outside the demo), so there is never a redirect loop.

**How it is built.** `src/` is a copy of the website screens plus everything they import, produced by
`node tools/carve-out.mjs ../CitizenBankWebsite` (config in `tools/carve-out.config.json`; `node tools/make-package.mjs
../CitizenBankWebsite` syncs `package.json` versions). The tool never overwrites Hub-owned files: routes, `UserGuard`,
header, footer, theme and `src/hub/`. It talks to the same `/api` (Vercel forwards it to the website backend), so there is
one source of truth. Re-run it to pull in website fixes, then review the diff.

## Run

```bash
npm install
cp .env.example .env.local     # fill in the Stack values
npm run dev                    # http://localhost:5173, /api goes to a local backend on :8000 (DEV_API_TARGET to change)
npm test && npm run build
HUB_E2E_STUB=1 npx vite build --outDir dist-stub && node tests/support/render.mjs shots   # screenshots, dark and light
```

## Publish on Vercel

1. Import this repository as a Vercel project (framework: Vite; `vercel.json` sets everything else).
2. Environment variables: `VITE_STACK_PROJECT_ID`, `VITE_STACK_PUBLISHABLE_CLIENT_KEY`, `VITE_WEBSITE_URL`.
3. In `vercel.json`, the first rewrite sends `/api/*` to `https://citizenbank.co.ls`. For the **demo**, change that
   address to the demo website's address before deploying.
4. In Stack Auth, add the Hub's address as a trusted domain. Later, add `hub.citizenbank.co.ls` as the project's domain.

Until `VITE_STACK_PROJECT_ID` is set, the deployed site says that sign-in is not configured.
