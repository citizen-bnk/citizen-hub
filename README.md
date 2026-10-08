# Citizen Hub

The institutional workspace for Citizen investors, shareholders, board members and management. Built afresh with Next.js 15.5.26, React 19.1.9 and TypeScript, matching the retained banking frontends. There is no Vite, React Router or browser authentication SDK in this implementation.

## Run

Use Node 22, `npm ci`, copy `.env.example` to `.env.local` and configure the server variables securely. Run `npm run dev` (port 3002). `npm test` checks authentication proof contracts, redirects, document references and role access. `npm run build` validates production compilation and TypeScript.

## Data and authentication

`CitizenBankCore/db/institutional` owns the versioned institutional schema. Hub uses an isolated `citizen_platform_business` database; banking data remains in the existing Core database. Apply the migrations in order before deployment. Do not point Hub at an uninitialised or legacy website schema.

Stack password sign-in is verified by the server. Session secrets stay in HTTP-only cookies; only their hashes are stored. Sessions expire after eight hours and can be revoked. Role checks and owner/scope filters run on the server. Password reset, additional verification flows, account administration and invitations remain to be implemented; existing accounts requiring those flows must not be represented as supported by this release.

`DEMO_MODE=true` exposes the optional account selector in the regular login page and enables fictional accounts. `DEMO_ACCOUNT_PASSWORD` stays server-only. Demonstration records are scoped separately from live institutional records. Turning the flag off blocks new and existing demonstration sessions. `/demo` is a compatibility route to the same login implementation, not a separate application.

The ES256 handoff uses the existing canonical person IDs, signing key and issuer to connect customer identities to the retained banking apps. The website proxies the JWKS, account catalogue and HMAC-authenticated shared profile contract for existing Core consumers. Keep `PLATFORM_ISSUER` unchanged until Core's trust configuration is deliberately migrated. Private signing and profile-service keys must never be exposed as public variables.

## Documents

Document records contain Google Drive file IDs, shared links and permission metadata only. No file bytes are stored in the database. Drive permissions remain authoritative when opening a link. Direct upload, filing, access validation and backups require the authorised Google Drive integration and are shown as Coming soon.

## Availability

Implemented: role-aware launch, executive overview, board agenda/RSVP/voting, investor records, shared profile editing, personal tasks, notifications, and Drive document linking. Licensing, treasury, risk, careers, projects, AI, subscription/payment processing, certificates, committee administration and secure discussions are shown as Coming soon. This release must not be described as completing those business workflows or as ready to accept real money.

Vercel framework: Next.js; build `npm run build`; install `npm ci`; output directory unset. Configure the variables in `.env.example` in the existing Hub project. Deploy the verified Git commit and test canonical URLs after promotion.
