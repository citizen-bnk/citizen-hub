# Investment administration and document control

The Hub subscription is the canonical transaction record. Google Form responses are imported source evidence, linked to that record after administrator reconciliation; changed responses return to review. Importing never confirms payment or silently changes an executed contract. This release does not write Hub changes back into Google Forms.

## Administrator workflow

1. Invest → Cap table → Capture investor subscription, or CitizenAI → Prepare investor transaction.
2. Select the existing investor and approved SAFE offer. Review purchased reference units, bonus units and a documented minimum exception for an existing-investor top-up.
3. Select company offering or existing shareholder. A personal offering needs a confirmed source holding with sufficient shares. It remains a proposed transfer until corporate reconciliation; no automatic register debit occurs.
4. Confirm the preview. Administrator capture is not subscriber acceptance. Record each cash receipt separately, with date, reference, evidence or attestation and notes. Duplicate operation keys cannot create duplicate receipts. Amounts cannot exceed the subscription balance.
5. Prepare the SAFE, conditional offering agreement, invoice, receipt and unsigned certificate preview from the saved record. Bank evidence or approved deferral is required before requesting signatures. The recipient and offeror/authorised company signatory sign the offering agreement separately.
6. A different administrator approves the bonus only after full principal receipt and completed offering-agreement signing. This approval does not issue shares. Authorised conversion/register reconciliation and company certificate signatures remain separate requirements.

Receipts can be reversed with an audit reason while contractual signing has not started. Signed or signing records are protected. Unsigned subscription quantities can be amended with version checks, a reason, and no reduction below cash received. Amending clears payment authorisation and bonus approval and requires new document review. Principal prices are never supplied by AI or the browser.

## CitizenAI

CitizenAI is a visible sidebar entry and the default landing screen; explicit return paths are preserved. Administrator-only assistants propose structured transaction/document drafts. The administrator selects/reviews the exact investor and confirms before mutation or generation. AI does not sign for users, transfer money, issue ownership or bypass roles. Context contains role/scope-limited records and recent summaries, not unrestricted system exports, secrets or applicant identity photographs. Users with no administrator role cannot invoke administrative drafting endpoints.

## PDFs and Drive

Personalised PDF files are saved in an owner-only investor folder. A verified, administrator-linked existing investor folder is reused; otherwise a private folder with a person identifier is created under the configured scoped document root. Individual documents receive explicit recipient permissions through sharing/signing; parent folders are not shared. Live and demonstration scopes remain separate.

Unsigned revisions reuse a document reference and receive increasing revision numbers, printed within the PDF with source record version and predecessor. Old files remain available. A signed document or active signing request cannot be overwritten by draft generation. A new investment or signed amendment uses a separate reference and fresh signatures. Each document retains a content digest and Drive link; no document bytes are stored in the database.

SAFE/certificate templates require an administrator's exact-version approval in Documents before generation. Financial receipts reflect recorded ledger cash only; missing evidence is not independently verified by AI. Generic offering agreements are drafts requiring review of terms and corporate authority before requesting signatures. Identity reference/address are confirmed by an administrator, never invented by AI. No application email sending or reminder automation was added by this release.

## Verification

Regression tests cover money precision, partial/full payment bonus eligibility, overpayment rejection and signed-document protection. Disposable integration checks cover admin-only/idempotent capture, partial receipts, stale actions, full-settlement gating, minimum exceptions, signed offering prerequisites, independent bonus approval and live/demo separation. Browser checks cover the initial AI screen, icon sidebar and trailing viewport-positioned actions. Full real-person template approval, document generation and signing acceptance remain human-controlled steps.
