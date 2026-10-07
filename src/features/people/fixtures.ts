/** API responses the People feature's screens read, for the render test (`npm run test:render`). */
const user = (id: string, name: string, email: string, status: string, roles: string[], pct: number) => ({
  user_id: id, email, full_name: name, phone: "+266 5800 1234", status, account_type: "individual",
  created_at: "2026-03-14T09:30:00Z", profile_completion_percentage: pct, roles,
});
const users = [
  user("u1", "Lineo Mokoena", "lineo@example.co.ls", "active", ["investor", "shareholder"], 90),
  user("u2", "Thabo Nkosi", "thabo@example.co.ls", "active", ["board_member", "investor"], 100),
  user("u3", "Palesa Sello", "palesa@example.co.ls", "suspended", ["staff", "back_office"], 70),
];

export default {
  "GET /api/invitation-permissions/check/:role": { can_invite: true, reason: "You have permission to invite this role" },
  "GET /api/back-office/invitations": {
    invitations: [
      { id: 11, email: "ntate.k@example.co.ls", full_name: "Kabelo Mothibi", role: "board_member", position: "director", status: "pending", invited_by_name: "Palesa Sello", created_at: "2026-10-01T08:00:00Z", expires_at: "2026-12-30T08:00:00Z", accepted_at: null, reminder_metadata: { reminder_count: 1, last_reminder_sent_at: "2026-10-04T08:00:00Z" } },
      { id: 12, email: "mpho@example.co.za", full_name: "Mpho Dlamini", role: "investor", position: null, status: "accepted", invited_by_name: "Palesa Sello", created_at: "2026-09-12T08:00:00Z", expires_at: "2026-10-12T08:00:00Z", accepted_at: "2026-09-14T10:00:00Z" },
      { id: 13, email: "old@example.co.za", full_name: "Old Invite", role: "investor", position: null, status: "expired", invited_by_name: "Thabo Nkosi", created_at: "2026-06-01T08:00:00Z", expires_at: "2026-06-08T08:00:00Z", accepted_at: null },
    ],
  },
  "GET /api/investor-leads/analytics": {
    total_leads: 42, leads_by_status: { new: 14, contacted: 10, interested: 6, invited: 7, converted: 4, declined: 1 },
    leads_by_source: { website: 20, referral: 12, event: 10 }, conversion_rate: 9.52, avg_days_to_conversion: 18.5,
    recent_conversions: 2, total_invited: 11, invitation_response_rate: 45.45,
  },
  "GET /api/investor-leads/list": [
    { id: 1, full_name: "Retselisitsoe Ramone", email: "ret@example.co.ls", phone: null, company: "Maseru Traders", country: "Lesotho", lead_source: "referral", investment_interest_amount: 50000, preferred_share_class: "Class A - Ordinary Shares", status: "interested", notes: null, created_at: "2026-09-20T08:00:00Z", latest_activity: "note_added", invitation_count: 0 },
    { id: 2, full_name: "Anna van Wyk", email: "anna@example.co.za", phone: "+27 82 555 0100", company: null, country: "South Africa", lead_source: "website", investment_interest_amount: null, preferred_share_class: null, status: "invited", notes: null, created_at: "2026-09-02T08:00:00Z", latest_activity: "invitation_sent", invitation_count: 1 },
    { id: 3, full_name: "Tumelo Phiri", email: "tumelo@example.co.ls", phone: null, company: null, country: "Lesotho", lead_source: "event", investment_interest_amount: 20000, preferred_share_class: null, status: "converted", notes: null, created_at: "2026-08-11T08:00:00Z", latest_activity: "converted", invitation_count: 2 },
  ],
  "GET /api/users/admin/list": { users, total: 3, page: 1, page_size: 50, total_pages: 1 },
  "GET /api/users/admin/search": { users: [users[0]], total: 1 },
  "GET /api/roles/all": ["investor", "shareholder", "board_member", "back_office", "staff", "admin", "super_admin"].map((role_name, i) => ({ id: i + 1, role_name, description: null })),
  "GET /api/user-activity/role-history/:id": {
    user_id: "u1", total_changes: 2, current_roles: ["investor", "shareholder"],
    role_events: [
      { id: 2, role_name: "shareholder", action: "assigned", performed_by_user_id: "u9", performed_by_name: "Palesa Sello", reason: null, changed_at: "2026-05-02T10:00:00Z" },
      { id: 1, role_name: "investor", action: "assigned", performed_by_user_id: "u9", performed_by_name: "Palesa Sello", reason: "Invitation accepted", changed_at: "2026-03-14T10:00:00Z" },
    ],
  },
  "GET /api/user-activity/suspension-history/:id": {
    user_id: "u1", total_suspensions: 1, current_status: "active",
    suspension_events: [{ id: 1, action: "suspend", reason: "Unverified documents", suspended_by_user_id: "u9", suspended_by_name: "Admin User", suspended_at: "2026-04-01T09:00:00Z", reactivated_at: "2026-04-03T09:00:00Z" }],
  },
  "GET /api/user-activity/login-history/:id": {
    user_id: "u1", total_logins: 12, successful_logins: 11, failed_logins: 1, last_login: "2026-10-06T07:45:00Z",
    login_events: [{ id: 1, login_timestamp: "2026-10-06T07:45:00Z", ip_address: "196.1.2.3", user_agent: null, location_country: "Lesotho", location_city: "Maseru", success: true, failure_reason: null }],
  },
  "GET /api/back-office/dashboard/stats": {
    board_members: { active: 7, total: 8 }, invitations: { pending: 3, total: 21 },
    subscriptions: { active: 58, total_invested: 1840000, total: 64 }, crypto_wallets: { active: 4, total: 5 },
    documents: { pending: 9, total: 96 },
  },
} as Record<string, unknown>;
