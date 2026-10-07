/** API responses the decisions screens read (shapes from backend/app/apis/governance). */
const stamp = "2026-09-01T08:00:00+00:00";
const session = (o: Record<string, unknown>) => ({
  id: 1, session_type: "board_resolution", title: "Approve the 2027 operating budget", description: "Resolution to adopt the 2027 operating budget as tabled.",
  status: "active", opens_at: "2026-09-01T08:00:00+00:00", closes_at: "2030-12-01T17:00:00+00:00", meeting_date: null, meeting_location: null, meeting_link: null,
  requires_quorum: false, quorum_percentage: null, created_by: "u-staff", created_at: stamp, updated_at: stamp, ...o,
});
const vote = (o: Record<string, unknown>) => ({ id: 1, session_id: 2, item_id: null, voter_id: "u-board", voter_type: "board_member", vote_value: "for", voting_power: 1, voted_on_behalf_of: null, comments: null, voted_at: stamp, ...o });

export default {
  "GET /api/governance/pending-actions": {
    pending_actions: [
      { action_type: "vote", session_id: 1, title: "Approve the 2027 operating budget", description: "Vote on board resolution", deadline: "2030-12-01T17:00:00+00:00", priority: "high" },
      { action_type: "approve_minutes", session_id: 7, title: "Approve minutes: Q3 board meeting", description: "q3-minutes.pdf", deadline: null, priority: "normal" },
    ],
  },
  "GET /api/governance/history": {
    votes: [{ ...vote({}), title: "Appoint external auditor", session_type: "board_resolution", session_date: stamp }],
    approvals: [{ id: 3, approval_type: "minutes", item_id: 5, approver_id: "u-board", status: "approved", response_value: null, comments: null, approved_at: stamp, file_name: "q2-minutes.pdf", title: "Q2 board meeting" }],
  },
  "GET /api/governance/sessions": {
    sessions: [
      session({}),
      session({ id: 2, title: "Appoint external auditor", status: "closed", closes_at: "2026-08-15T17:00:00+00:00" }),
      session({ id: 3, session_type: "agm_vote", title: "2026 Annual General Meeting", status: "draft", closes_at: "2030-11-20T17:00:00+00:00" }),
    ],
  },
  "GET /api/governance/my-proxy-assignments": {
    proxies_given: [],
    proxies_received: [{ id: 4, assignor_id: "u-bm2", proxy_id: "u-board", scope_type: "all_votes", session_id: null, valid_until: null, notes: null, status: "active", assignor_name: "Lineo Sello", assignor_email: "lineo@example.com" }],
    available_users: [{ id: "u-bm2", name: "Lineo Sello", email: "lineo@example.com" }, { id: "u-bm3", name: "Palesa Nthane", email: "palesa@example.com" }],
  },
  "GET /api/governance/sessions/:id/results": {
    session: session({ id: 2, title: "Appoint external auditor", status: "closed" }),
    total_voting_power: 5,
    results: { "0": { for: { count: 3, voting_power: 3 }, against: { count: 1, voting_power: 1 }, abstain: { count: 1, voting_power: 1 } } },
  },
  "GET /api/governance/sessions/:id/board-members-for-notification": [
    { user_id: "u-bm1", full_name: "Thabo Mokoena", email: "thabo@example.com", position: "Chair" },
    { user_id: "u-bm2", full_name: "Lineo Sello", email: "lineo@example.com", position: "Director" },
  ],
  "GET /api/governance/sessions/:id": {
    session: session({ id: 3, session_type: "agm_vote", title: "2026 Annual General Meeting", status: "draft" }),
    items: [
      { id: 11, session_id: 3, item_order: 0, question: "Adopt the audited financial statements", description: null, item_type: "vote", options: ["for", "against", "abstain"] },
      { id: 12, session_id: 3, item_order: 1, question: "Re-elect the chair", description: "Thabo Mokoena, three-year term.", item_type: "vote", options: ["for", "against", "abstain"] },
    ],
    my_votes: [],
    documents: [{ id: 21, session_id: 3, document_type: "agenda", file_url: "https://example.com/agm-agenda.pdf", file_name: "AGM agenda.pdf", file_size: 120000, description: null, uploaded_by: "u-staff", uploaded_at: stamp, status: "draft" }],
  },
} as Record<string, unknown>;
