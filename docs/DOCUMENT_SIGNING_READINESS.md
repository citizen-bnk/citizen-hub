# Citizen Hub document signing and delivery readiness

Verified 9 October 2026. This is a source and connection audit, not a claim that automatic signing or document delivery is deployed.

## Connection findings

The Citizen Vercel team and Hub project return no linked Vercel Connect connectors. The five deployed application projects have no Google Drive application environment keys. The connected Drive tool used for research is separate from the server that runs the Hub.

Historical website code contains Google Drive OAuth endpoints and expects `GOOGLE_DRIVE_CLIENT_ID` and `GOOGLE_DRIVE_CLIENT_SECRET`; it stores a consented refresh token in its old connection configuration. That code does not establish a connection in the replacement Hub. Do not recover or copy old tokens implicitly, or restore the retired website for this purpose.

Existing authentication mail works through the identity provider's Resend connection. No application Resend sending key was found in Hub environment metadata. Authentication delivery does not establish that subscription emails can be sent.

## Verified source templates

| Material | Drive source | Finding |
| --- | --- | --- |
| New-subscription SAFE | [R10 SAFE](https://docs.google.com/document/d/1LOoXZ2_WvENpz0icVY-5Gi2M40UHP3oJ/edit) | DOCX; R10 reference price and R10,000 minimum. Future conversion to ordinary equity, not immediate issued shares. |
| Historical term sheet | [September term sheet](https://docs.google.com/document/d/1_T8QIDT9wIBJ6HZKrFAeq_druaZGN35d/edit) | DOCX; contains expired R5 offer, outdated contact details and licensing claims requiring review. Preserve the original and prepare a current approved version before distribution. |
| Citizen certificate | [Fillable certificate](https://drive.google.com/file/d/1K0ICAxD2MeuKqQ_f0INBbIWHj0pekMsQ/view) | One landscape A4 page, seven canonical form fields and seven widgets. No encryption. Signature slots are text fields, not cryptographic PDF signature fields. |

Certificate field names: `investor_name`, `certificate_number`, `number_of_shares`, `date_issued`, `secretary_signature`, `chairman_signature`, `cert_no_footer`.

Do not populate officer signatures from historical contracts. A pending SAFE preview must carry an obvious unsigned/not-issued watermark, omit an issued certificate number/date and confer no ownership rights. An issued certificate requires approved conversion, an approved register entry and separately authorised company signatures.

## Agreed user journey

1. Investor subscribes at the approved price; the subscription remains private in their portfolio.
2. Hub creates the personalised SAFE and invoice in Drive from approved versioned templates. Investor can review both before signing or paying.
3. Investor draws or uploads their own signature. The original signature asset is held in private Drive storage; the database stores only its file reference, owner, version and digest.
4. For each signature application, Hub displays the exact document, document digest/version, signer capacity and consent text. The investor explicitly authorises that one document after fresh authentication. Saving a signature grants no future blanket consent.
5. Server applies the authorised signature to that immutable document version, files a separate resulting PDF and audit record in Drive, and records the resulting link and digest. A failure leaves the operation pending/failed, never signed or delivered. Retries use the same operation identifier.
6. Company countersignature is a separate action by an authorised officer. Investor consent cannot sign for the company, and administrator access cannot sign as the investor.
7. Payment may be skipped. Payment evidence goes through reconciliation against the receiving bank record; neither an AI interpretation nor an uploaded proof alone confirms settlement.
8. Subscription confirmation, document links and approved payment reminders use the application email service. Device notifications require opt-in. Demonstration and preview deployments must not send investor communications.
9. Payment confirmation creates the receipt workflow. SAFE conversion and eventual share-certificate issuance remain separate corporate actions.

A saved image plus recorded consent must not be described as a qualified or cryptographic digital signature. If stronger independent identity assurance is required, select and provision a signing service before integrating its API.

## Drive connection setup to complete

First identify the existing Google Cloud/OAuth project or connector by name; no secrets belong in chat or this repository. Reuse it only after confirming the intended Citizen administrator owns and can maintain it.

For a new connection, an administrator must authorise a Google Drive server connection for the Hub. Keep generated documents and signature assets in a dedicated private folder within Citizen Digital; sharing must be limited to the intended investor and authorised officers. Do not make the folder or financial documents public to anyone with the link. A shared link is an access locator, not an access-control policy.

Use the minimum scope that supports the approved workflow. `drive.file` grants access to files explicitly created/opened by the application, not automatic access to every existing template in the root folder. Existing templates therefore need explicit selection/import into the application's accessible set. Do not silently request whole-Drive access to avoid this step.

Office DOCX files are not native Google Docs. The preparation stage must produce approved, versioned native Docs or PDF templates with verified placeholders/signature positions before automating Google Docs editing/export. Copying a DOCX with Drive does not convert it.

Before enabling automatic signing: confirm the authorised connection can read approved templates, create a private test PDF, share it with the intended test recipient, reopen it and verify its hash. Verify the final rendered PDF visually. Remove the disposable test artifact after the check. Do not start with real investor signatures.

## Release gates and recovery

| Condition | User outcome / recovery |
| --- | --- |
| Drive not connected or consent revoked | State that document filing is unavailable; allow return to the portfolio and administrator reconnection. Never claim a signed document exists. |
| Document changed since preview | Reject authorisation; require preview and approval of the new version. |
| Signature absent or revoked | Offer signature setup; do not use an old signature automatically. |
| Wrong owner, role or environment | Deny without exposing the other person's document or signature. |
| Duplicate click/retry | Return the same operation result without creating another agreement or invoice. |
| PDF filing fails after processing | Retain pending status and retry the same operation; do not mark complete without a verified Drive artifact. |
| Email accepted by provider | Record accepted status; distinguish delivered/bounced status when verified by a signed provider webhook. |
| Payment proof received | Pause payment reminders during review; show evidence awaiting verification. |
| Withdrawn, declined or settled subscription | Stop outstanding-payment reminders. |

Outstanding prerequisites: locate/authorise Drive runtime connection; approve dedicated application email credential access; confirm current receiving bank instructions; approve the updated term-sheet content. Automatic application of signatures, personalised document filing, transactional subscription emails and device push remain unfinished until their real connections and end-to-end checks are completed.
