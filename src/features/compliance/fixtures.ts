/** API responses the compliance screens and widgets read, for the render test. */
const req = (id: number, name: string, extra: Record<string, unknown> = {}) => ({
  id, name, description: `${name} as certified by the issuing authority.`, jurisdictions: ["global", "lesotho"], file_formats_accepted: ["pdf", "jpg", "png"],
  max_file_size_mb: 10, is_required: true, requires_template: false, validity_period_days: null, display_order: id, is_active: true,
  template_file_name: null, ...extra,
});
const sub = (id: number, status: string, extra: Record<string, unknown> = {}) => ({
  id, board_member_id: 4, document_requirement_id: id, status, file_name: `document-${id}.pdf`, submitted_at: "2026-09-12T09:30:00Z",
  rejection_reason: null, review_notes: null, expires_at: null, ...extra,
});
const item = (requirement: ReturnType<typeof req>, submission: ReturnType<typeof sub> | null, is_complete = false) => ({
  requirement, submission, is_required: requirement.is_required, is_complete, days_until_expiry: null,
});

const requirements = [
  req(1, "Certified ID copy"),
  req(2, "Proof of residence", { validity_period_days: 90 }),
  req(3, "Tax clearance certificate", { requires_template: true, template_file_name: "tax-clearance-template.docx" }),
  req(4, "Signed fit-and-proper declaration", { requires_template: true, template_file_name: "declaration.docx" }),
  req(5, "Reference letter", { is_required: false }),
];

export default {
  "GET /api/board-documents/checklist": {
    jurisdiction: "lesotho",
    items: [
      item(requirements[0], sub(1, "approved"), true),
      item(requirements[1], sub(2, "under_review")),
      item(requirements[2], sub(3, "rejected", { rejection_reason: "The certificate has expired; please send the current year." })),
      item(requirements[3], null),
      item(requirements[4], null),
    ],
  },
  "GET /api/board-documents/review-queue": [
    { document_id: 12, board_member_id: 4, board_member_name: "Palesa Mokoena", board_member_email: "palesa@example.com", requirement_id: 2, requirement_name: "Proof of residence", file_name: "utility-bill.pdf", file_url: "x", file_size_kb: 412, submitted_at: "2026-09-12T09:30:00Z", resubmission_count: 0, status: "under_review" },
    { document_id: 15, board_member_id: 6, board_member_name: "Thabo Letsie", board_member_email: "thabo@example.com", requirement_id: 3, requirement_name: "Tax clearance certificate", file_name: "tax.pdf", file_url: "x", file_size_kb: 880, submitted_at: "2026-09-20T14:05:00Z", resubmission_count: 1, status: "submitted" },
  ],
  "GET /api/board-documents/all-members-status": [
    { board_member_id: 4, user_id: "u4", full_name: "Palesa Mokoena", position: "Chairman", email: "palesa@example.com", total_required: 4, total_submitted: 3, total_approved: 1, total_rejected: 1, completion_percentage: 25, last_activity: "2026-09-12T09:30:00Z", status: "needs_attention" },
    { board_member_id: 6, user_id: "u6", full_name: "Thabo Letsie", position: "Treasurer", email: "thabo@example.com", total_required: 4, total_submitted: 4, total_approved: 4, total_rejected: 0, completion_percentage: 100, last_activity: "2026-09-20T14:05:00Z", status: "complete" },
    { board_member_id: 9, user_id: "u9", full_name: "Lineo Sekhonyana", position: "Director", email: "lineo@example.com", total_required: 4, total_submitted: 0, total_approved: 0, total_rejected: 0, completion_percentage: 0, last_activity: null, status: "not_started" },
  ],
  "GET /api/board-documents/readiness-report": {
    overall_compliance: 42.5,
    jurisdictions: [
      { jurisdiction: "lesotho", total_board_members: 3, fully_compliant_members: 1, compliance_percentage: 41.7, critical_missing_documents: ["Tax clearance certificate"], total_documents_required: 12, total_documents_submitted: 7, total_documents_approved: 5 },
      { jurisdiction: "global", total_board_members: 3, fully_compliant_members: 1, compliance_percentage: 50, critical_missing_documents: [], total_documents_required: 6, total_documents_submitted: 4, total_documents_approved: 3 },
    ],
  },
  "GET /api/board-documents/requirements": requirements,
  "GET /api/board-documents/settings": requirements.map((r) => ({ requirement_id: r.id, requirement_name: r.name, default_severity: r.id === 3 ? "critical" : "normal", notification_popup_behavior: "badge", auto_reminder_interval_days: 7, escalation_enabled: false })),
} as Record<string, unknown>;
