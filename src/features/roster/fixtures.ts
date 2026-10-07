/** API responses the roster screens and widget read, for the render test. */
const status = (held: number, required: number) => ({ meets_requirement: held >= required, total_shares: held, required_shares: required, shares_needed: Math.max(required - held, 0), investment_needed: Math.max(required - held, 0) * 100 });
const docs = (approved: number) => ({ total_required: 4, uploaded: approved + 1, approved, missing: 4 - approved - 1, pending_review: 1, compliance_percentage: approved * 25 });

const members = [
  { board_member_id: 4, user_id: "u4", full_name: "Palesa Mokoena", email: "palesa@example.com", position_name: "Chairman", position_level: 1, minimum_investment_shares: 500, appointed_at: "2025-02-01T00:00:00Z", term_end_date: "2028-02-01T00:00:00Z", status: "active", investment_status: status(520, 500), profile_completion_percentage: 100, document_compliance: docs(3) },
  { board_member_id: 6, user_id: "u6", full_name: "Thabo Letsie", email: "thabo@example.com", position_name: "Treasurer", position_level: 3, minimum_investment_shares: 300, appointed_at: "2025-06-15T00:00:00Z", term_end_date: "2026-11-15T00:00:00Z", status: "active", investment_status: status(120, 300), profile_completion_percentage: 80, document_compliance: docs(1) },
  { board_member_id: 9, user_id: "pending_9", full_name: "Lineo Sekhonyana", email: "lineo@example.com", position_name: "Director", position_level: 5, minimum_investment_shares: null, appointed_at: "2026-09-01T00:00:00Z", term_end_date: "2029-09-01T00:00:00Z", status: "inactive", investment_status: null, profile_completion_percentage: null, document_compliance: null },
];
const positions = [
  { id: 1, position_name: "Chairman", position_level: 1, description: "Chairs the board and its meetings", created_at: "2025-01-01T00:00:00Z" },
  { id: 2, position_name: "Treasurer", position_level: 3, description: null, created_at: "2025-01-01T00:00:00Z" },
  { id: 3, position_name: "Director", position_level: 5, description: "Non-executive director", created_at: "2025-01-01T00:00:00Z" },
];
const history = [
  { id: 11, board_member_id: 6, board_member_name: "Thabo Letsie", position_name: "Treasurer", position_level: 3, appointed_at: "2025-06-15T00:00:00Z", ended_at: null, removed_at: null, term_end_date: "2026-11-15T00:00:00Z", appointed_by: "u1", appointed_by_name: "Admin User", is_current: true, notes: "Elected at the AGM" },
  { id: 10, board_member_id: 6, board_member_name: "Thabo Letsie", position_name: "Director", position_level: 5, appointed_at: "2025-02-01T00:00:00Z", ended_at: "2025-06-15T00:00:00Z", removed_at: null, term_end_date: null, appointed_by: "u1", appointed_by_name: "Admin User", is_current: false, notes: null },
];

export default {
  "GET /api/board-positions/members-with-investment": { members, total: members.length },
  "GET /api/board-positions": { positions },
  "GET /api/board-positions/history": { history, total: history.length },
  "GET /api/board-mapping/unmapped-members": { unmapped_members: [{ board_member_id: 9, email: "lineo@example.com", full_name: "Lineo Sekhonyana", position: "director", appointed_date: "2026-09-01", status: "inactive" }], total_count: 1 },
  "GET /api/board-mapping/available-users": { users: [{ user_id: "u20", email: "lineo@example.com", full_name: "Lineo Sekhonyana", account_type: "personal" }], total_count: 1 },
  "GET /api/board/dashboard": {
    profile: { position: "chairman", appointed_date: "2025-02-01", term_end_date: "2028-02-01", status: "active", total_shares: 420, board_member_id: 4 },
    onboarding_status: null, pending_approvals: [], is_chair: true, popup_notification: null, document_summary: null, next_meeting: null,
  },
} as Record<string, unknown>;
