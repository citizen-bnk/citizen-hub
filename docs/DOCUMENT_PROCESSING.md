# Investment document processing

The Hub uses a dedicated document-pack agent through its existing signed Core AI connection. The agent checks a fixed pack schema; canonical subscription data and approved templates determine document content. It has no payment, approval, signing, cap-table or arbitrary file access tools.

## Processing

Subscription inserts and version changes persist jobs in `hub_subscription_document_jobs`. Submission, ledger actions, certificate-number assignment and the Prepare / update action start processing with Next.js `after`. Vercel Cron calls `/api/document-jobs` every ten minutes using the existing server-only `CRON_SECRET`, recovering work left queued or with a processing lease older than five minutes.

A job verifies its requester is active, still owns the subscription or currently has administrator rights, and is in the same data scope. A stale version is superseded. Failed jobs retain their issue code and partial results; users retry after resolving the issue. Financial confirmation remains independent of document processing.

Unpaid subscriptions require invoice, SAFE and certificate preview. Recorded payments add a receipt. Conditional additional allocations add their agreement. Receipts use the saved non-voided ledger only. Ordinary shares are never issued by this worker.

## Templates

New subscriptions use `safe`; numbered top-ups use `safe_topup`; certificate previews use `certificate`. New DOCX sources use named double-brace fields. The legacy R10 mapping is retained for existing compatible templates. Personal transfers require a separately reviewed amendment instead of the company-allocation top-up wording.

Upload a replacement in Document Centre and approve its exact version. Changing it resets approval and preserves the prior registry version in `hub_document_template_history`. Preparation verifies the approved source digest. Signed SAFEs and documents under signing are preserved.

Before generating SAFE or certificate documents, an administrator assigns the permanent CB number from the subscription record. This action resumes preparation. Existing CB numbers retain their incremental top-up suffixes. The SAFE's instrument reference is that CB number, while its document-control reference includes `-SAFE`.

## Filing and retries

Files are private to the Drive owner and accessed through the Hub's existing document permissions. Generated PDFs are filed under investor / subscription reference / document category. Working native Docs remain private in a Working drafts category. The database stores links, digests, version metadata and job state, not document bytes.

Exact-version documents are reused on retries. A changed approved template generates a new unsigned revision. Preparation snapshots bind source record version, template digest, reference, revision and superseded document. Native working drafts record their personalisation digest and revision; unexpected edits require review. A request key cannot be reused for different document content.

## Verification

`npm test` covers pack validation and rejects changed model record IDs, versions, extra/duplicate document types and unverified payment assertions. The production build validates route types. The operations live check uses fictional demonstration identities to test complete packs, private downloads and duplicate prevention. Real financial records are not used as test fixtures.
