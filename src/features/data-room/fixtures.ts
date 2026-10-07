/** API responses the data room screens read on load, for the render test. */
const doc = (id: number, category_id: number, category_name: string, document_name: string, version = "1.0", file_size = 482_113, description: string | null = null, is_required_for_license = false) =>
  ({ id, category_id, category_name, document_name, file_size, version, description, is_required_for_license });

const investorDocs = [
  doc(1, 1, "Corporate", "Articles of Association", "2.1", 312_450, "Signed and filed copy", true),
  doc(2, 1, "Corporate", "Shareholder Register", "1.4", 98_221),
  doc(3, 2, "Financial", "Business Plan 2026-2030", "1.0", 2_845_000, "Five-year plan submitted to the regulator", true),
  doc(4, 2, "Financial", "Financial Projections", "1.2", 1_120_300),
  doc(5, 3, "Governance", "Board Charter", "1.0", 204_800),
];

export default {
  "GET /api/data-room/investor/check-access": { has_access: true, ncnda_signed: true, terms_signed: true, loi_agreed: true, missing_agreements: [] },
  "GET /api/data-room/investor/agreements/my-status": {
    ncnda_signed: true, ncnda_signed_at: "2026-09-02T09:14:00", terms_signed: true, terms_signed_at: "2026-09-02T09:15:00",
    loi_agreed: true, loi_agreed_at: "2026-09-02T09:17:00", loi_file_url: null, loi_status: "pending",
  },
  "GET /api/data-room/investor/agreements/ncnda/current": {
    version: "1.0", effective_date: "2026-01-01T00:00:00",
    content: "NON-CIRCUMVENTION AND NON-DISCLOSURE AGREEMENT\n\n1. The recipient will keep all data room documents confidential.\n2. The recipient will not approach the bank's partners or regulators about this opportunity without written consent.\n3. This agreement stays in force for five years.",
  },
  "GET /api/data-room/investor/documents": investorDocs,

  "GET /api/data-room/admin/categories": [
    { id: 1, category_name: "Corporate", description: "Constitutional documents", display_order: 1, parent_category_id: null, created_at: "2026-01-10T08:00:00" },
    { id: 2, category_name: "Financial", description: "Plans and projections", display_order: 2, parent_category_id: null, created_at: "2026-01-10T08:01:00" },
    { id: 3, category_name: "Governance", description: null, display_order: 3, parent_category_id: null, created_at: "2026-01-10T08:02:00" },
  ],
  "GET /api/data-room/admin/documents": {
    total: investorDocs.length,
    documents: investorDocs.map((d, i) => ({ ...d, file_url: `data_room_Doc${d.id}.pdf`, uploaded_by: "user-office-1", uploaded_at: `2026-0${(i % 6) + 2}-12T10:00:00`, status: "active" })),
  },
  "GET /api/data-room/audit/access-logs": {
    total: 2,
    logs: [
      { id: 11, user_id: "7f3a9c21-55b0-4c1e-8f0d-2a1b9d3e6c44", document_id: 3, document_name: "Business Plan 2026-2030", accessed_at: "2026-10-05T14:22:00", access_reason: "Reviewing the plan before the board call", ip_address: "41.203.10.7", user_agent: "Mozilla/5.0" },
      { id: 10, user_id: "b1e2d4f6-0a77-4e2b-9c13-5d8f7a6b2e90", document_id: 1, document_name: "Articles of Association", accessed_at: "2026-10-04T09:05:00", access_reason: "Due diligence", ip_address: "102.68.4.22", user_agent: "Mozilla/5.0" },
    ],
  },
  "GET /api/data-room/audit/document-stats": {
    total_documents: 2,
    stats: [
      { document_id: 3, document_name: "Business Plan 2026-2030", category_name: "Financial", total_accesses: 7, unique_users: 4, last_accessed: "2026-10-05T14:22:00" },
      { document_id: 1, document_name: "Articles of Association", category_name: "Corporate", total_accesses: 3, unique_users: 3, last_accessed: "2026-10-04T09:05:00" },
    ],
  },
  "GET /api/data-room/audit/agreements": {
    total: 3,
    agreements: [
      { id: 3, user_id: "7f3a9c21-55b0-4c1e-8f0d-2a1b9d3e6c44", agreement_type: "letter_of_intent", signed_at: "2026-09-02T09:17:00", agreement_version: "1.0", ip_address: "41.203.10.7" },
      { id: 2, user_id: "7f3a9c21-55b0-4c1e-8f0d-2a1b9d3e6c44", agreement_type: "terms", signed_at: "2026-09-02T09:15:00", agreement_version: "1.0", ip_address: "41.203.10.7" },
      { id: 1, user_id: "7f3a9c21-55b0-4c1e-8f0d-2a1b9d3e6c44", agreement_type: "ncnda", signed_at: "2026-09-02T09:14:00", agreement_version: "1.0", ip_address: "41.203.10.7" },
    ],
  },
  "GET /api/data-room/audit/pending-agreements": {
    total: 1,
    pending_users: [{ user_id: "c9d8e7f6-1234-4abc-9def-0a1b2c3d4e5f", missing_agreements: ["terms", "letter_of_intent"], has_subscriptions: true, has_board_investments: false }],
  },
  "GET /api/data-room/audit/loi-submissions": {
    total: 2,
    submissions: [
      { id: 5, user_id: "7f3a9c21-55b0-4c1e-8f0d-2a1b9d3e6c44", file_url: null, submitted_at: "2026-09-02T09:17:00", status: "pending", reviewed_by: null, reviewed_at: null, notes: null },
      { id: 4, user_id: "b1e2d4f6-0a77-4e2b-9c13-5d8f7a6b2e90", file_url: null, submitted_at: "2026-08-20T11:00:00", status: "approved", reviewed_by: "user-office-1", reviewed_at: "2026-08-21T08:30:00", notes: "Known to the board" },
    ],
  },
} as Record<string, unknown>;
