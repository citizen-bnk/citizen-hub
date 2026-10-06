# Citizen Hub

The Citizen Hub frontend for **hub.citizenbank.co.ls**: the entry point for investors, shareholders, the board and the
back office of Citizen Bank. Part of the [Citizen Bank ecosystem](https://github.com/citizen-bnk/CitizenBankWebsite/blob/claude/practical-volta-tqe0qk/docs/ECOSYSTEM.md).

## Status (version 0.1.0): the entry shell, not yet the full Hub

Built and tested:
- Sign-in with Stack Auth (the same project as the website, so one account works on both).
- A signed-in home that asks the website's platform API who you are (`/api/platform/me`) and offers only the
  workspaces your roles open: My investments, Board portal, Back office, Administration. Role rules come from
  [`@citizen-bnk/platform`](https://github.com/citizen-bnk/citizen-platform), the same table the website uses.
- A same-origin `/api` that Vercel forwards to the website, so the browser needs no cross-origin access to the API.

Not built yet: the workspace screens themselves. They still live in
[CitizenBankWebsite](https://github.com/citizen-bnk/CitizenBankWebsite), and each workspace link here opens them there
(`VITE_WEBSITE_URL`). Moving a screen means moving its page here and keeping calling the same API. Until the Hub
and the website share a parent domain, you may be asked to sign in again when you cross over.

## Run

```bash
npm install
cp .env.example .env.local     # fill in the two Stack values
npm run dev                    # http://localhost:5173, /api goes to a local backend on :8000 (DEV_API_TARGET to change)
npm test && npm run build
```

## Publish on Vercel

1. Import this repository as a Vercel project (framework: Vite; `vercel.json` sets everything else).
2. Environment variables: `VITE_STACK_PROJECT_ID`, `VITE_STACK_PUBLISHABLE_CLIENT_KEY`, `VITE_WEBSITE_URL`.
3. In `vercel.json`, the first rewrite sends `/api/*` to `https://citizenbank.co.ls`. For the **demo**, change that
   address to the demo website's address before deploying.
4. In Stack Auth, add the Hub's address as a trusted domain. Later, add `hub.citizenbank.co.ls` as the project's domain.

Until `VITE_STACK_PROJECT_ID` is set, the deployed site says that sign-in is not configured.
