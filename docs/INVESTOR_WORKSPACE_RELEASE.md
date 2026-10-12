# Investor administration, private communication and signing

Release prepared 12 October 2026.

## Working Hub journeys

- `/administration`: administrators edit investor dossiers and holdings, link existing accounts, preserve history and track pending reconciliation. Contact edits do not change authentication identities or grant roles.
- `/corporate-history`: previous snapshots, editor and reconciliation history. A different administrator confirms evidence. Subsequent corrections clear the approval.
- `/investors`: each investor sees their linked register entries and private subscriptions. SAFE reference units are not added to issued equity. Archived entries are excluded from current cap-table totals.
- `/messages`: administrators maintain private recipient groups, save drafts, review recipients and publish in-app updates. Published text and document links are frozen. Personalised SAFE/certificate documents are restricted to their recorded investor and required company signers.
- `/projects`: administrators maintain projects, audiences and dated milestones. Completion requires a Drive evidence link. Only published updates for the signed-in role are visible.
- `/document-centre`: private document references, direct PDF upload, approved source-template imports, personalised R10 SAFE drafts, unsigned previews, certificate preparation and per-document signature authorisation.

## Runtime connections still required

The connected research Drive account is separate from the Hub server. Verified Hub Vercel environment metadata contains no Drive or application Resend keys. Authentication mail may already use Resend; reuse that account rather than creating another provider account.

Configure these **server-only Production environment variables** in the `citizen-hub-demo` Vercel project, then redeploy:

| Variable | Purpose |
| --- | --- |
| `GOOGLE_DRIVE_CLIENT_ID` | Existing Citizen Google OAuth application client |
| `GOOGLE_DRIVE_CLIENT_SECRET` | Secret for that OAuth application |
| `GOOGLE_DRIVE_REFRESH_TOKEN` | Offline authorisation by `meshthang@gmail.com` for the Hub application |
| `GOOGLE_DRIVE_OWNER_EMAIL` | `meshthang@gmail.com` |
| `GOOGLE_DRIVE_DOCUMENTS_FOLDER_ID` | Dedicated owner-only production document folder in Citizen Digital |
| `GOOGLE_DRIVE_DOCUMENTS_DEMO_FOLDER_ID` | Separate owner-only fictional document folder; must differ from production |
| `RESEND_API_KEY` | Existing Resend account's application sending credential |
| `INVESTOR_EMAIL_FROM` | Verified Resend sender, for example the approved investor-support address |
| `RESEND_WEBHOOK_SECRET` | Secret for the Resend delivery webhook at `/api/messages/webhook` |
| `MESSAGE_UNSUBSCRIBE_SECRET` | Private random signing secret for newsletter opt-out links |

Enable Drive and Docs APIs in the existing OAuth project. Prefer `drive.file`, with explicit template import using Document Centre: it only accesses files the app creates or that are explicitly opened for it. Do not request whole-Drive access merely to read existing templates. An OAuth authorisation created by a different app is not interchangeable. Do not paste credentials in chat, commit them or place them in public environment variables.

Document folders must have owner-only permissions. Grant private reader access to each individual file, never the parent folder. Files/signature images remain in Google Drive; the institutional database stores references, hashes, consent and audit metadata only. Research access does not grant server access.

Import and review the R10 SAFE DOCX and fillable certificate PDF; import clears prior template approval. Approve each exact source digest before generation. Review all commercial terms, company warranties, licence timelines and receiving-bank instructions. Historical signed R5 contracts and the old term sheet are preserved.

## Signing controls and practical limits

A saved signature image is not a cryptographic/qualified digital signature. Each assigned signer reviews the original PDF, digest, version and capacity, signs in within five minutes, and authorises that one document. Administrators cannot apply another person's signature. SAFE execution requires its recorded investor and a separate company signatory. Certificates require an independently confirmed register entry and separate chairperson and company-secretary authorisations. Consent, source and resulting digests are recorded; original terms remain unchanged with a separate signature-authorisation appendix.

Previews omit issued numbers/dates and cannot be signed. Demo documents are visibly marked and use a separate folder. Revoked/changed assets, changed documents/registers, missing connections and interrupted filing do not become completed signatures. A filing retry uses the original operation identifier; retry is available if processing has stalled. Source/template Unicode or incompatible form fields may require template/font remediation before production filing.

Emails are explicit reviewed admin actions. They send to one recipient at a time without exposing the recipient list. Demonstration and preview deployments never send investor email. Newsletters require opt-in and include unsubscribe. Resend acceptance is distinct from delivery; signed webhooks record delivery/failure. Sending processes bounded batches of up to three recipients; the admin repeats the same action for remaining recipients. Safe retries reuse Resend idempotency keys within 23 hours. Beyond that, delivery must be reviewed before a new attempt.

## Verification and remaining release gates

35 automated tests and a production build pass. Disposable demonstration API checks cover corporate editing/approval/history, private portfolio records, group editing, reviewed messages, audience controls, completion evidence and missing-connection recovery. The actual source certificate has been filled/rendered with fictional values; its zero-height officer signature fields require derived boxes above their baselines.

No real investor emails were sent, no real signatures applied and no existing company holdings changed by verification. Drive generation/export/grant/signature filing and Resend delivery cannot be verified end-to-end until their server connections are configured. Perform those checks with consenting test identities and fictional documents first. Generated invoices/receipts and current term-sheet revision, automatic reminders/device push and integration with a future payment gateway remain separate outstanding work; their existing manual Drive-link workflow is retained.

Provider references: [Drive uploads](https://developers.google.com/workspace/drive/api/guides/manage-uploads), [Drive sharing](https://developers.google.com/workspace/drive/api/guides/manage-sharing), [Docs updates](https://developers.google.com/workspace/docs/api/reference/rest/v1/documents/batchUpdate), [Resend sending](https://resend.com/docs/api-reference/emails/send-email), [Svix signature verification](https://www.svix.com/guides/receiving/receive-webhooks-with-svix-cli/).

## Follow-up requirements included in this release

- Investment sign-in now gives new investors a prominent account-creation action that preserves the selected opportunity. Sign-in and registration include accessible password visibility controls and native illustrations.
- The subscription wizard explains that it prepares a SAFE note for signing, not immediate ownership. New Hub submissions persist in the institutional database and private investor/admin views.
- The existing Google Form response sheet has 24 responses as of 12 October. A source-reconciliation register imports its latest rows idempotently, preserves reported historical prices, and does not turn submission/payment proof/signature text into verified shares or executed contracts. User identity documents, addresses and signatures are excluded from this import. The admin directory has a Google Form subscriber section.
- `/api/form-subscriptions` supports a live-admin manual refresh and a protected scheduled refresh at 08:00 Africa/Johannesburg each day. Vercel's production `CRON_SECRET` is configured. Ongoing Google reads still require the Hub OAuth connection to be authorised for that existing response sheet. This is one-way ingestion into the Hub, not an overwrite of the source Form or its responses.
- Board nominations now select an existing registered investor/applicant, corporate shareholder/subscriber record, application or Google Form submission. The nomination preserves its source reference and creates no duplicate person or system role. Legacy nomination records must be linked before further review.
- Subscription signing requests require an administrator's recorded settlement confirmation or approved deferral with motivation and due date. Proof upload alone does not open signing. Drafts prepared before a payment review must be regenerated to reflect the approved arrangement; changing payment evidence clears its old authorisation. Active signing requests protect their payment snapshot. Completed SAFE execution under deferral still leaves payment outstanding, and ordinary-share issuance remains a separate conversion/register approval.
- `/users` lets administrators edit an existing profile in their environment and request a password-reset email to its existing login address after recent authentication. No administrator sees or sets another user's password; demo credentials are unchanged. Contact/profile updates do not change authentication email or system roles. Actual recovery delivery remains handled by the configured shared identity provider.
