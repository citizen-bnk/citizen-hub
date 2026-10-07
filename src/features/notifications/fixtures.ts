/** API responses the notification screens read on load, for the render test. */
export default {
  "GET /api/unread-count": { count: 2 },
  "GET /api/notification-preferences/my-preferences": { user_id: "u1", channel_email: true, channel_sms: false, channel_push: false, timezone: "Africa/Maseru", created_at: "2026-02-10T08:00:00", updated_at: "2026-09-01T08:00:00" },
  "GET /api/notifications": {
    notifications: [
      { id: 21, recipient_email: "thabo@example.com", email_subject: "Payment due for SUB-20260901-AB12CD34", email_content: "<p>Your next instalment of LSL 15,000.00 is due on 15 November.</p>", email_type: "payment_reminder", read_status: false, created_at: "2026-10-05T07:00:00", read_at: null, metadata: { url: "/portfolio/SUB-20260901-AB12CD34" } },
      { id: 20, recipient_email: "thabo@example.com", email_subject: "Upload your board documents", email_content: "Three required documents are still missing.", email_type: "board_documents", read_status: false, created_at: "2026-10-03T07:00:00", read_at: null, metadata: { url: "/board-documents?x=1" } },
      { id: 19, recipient_email: "thabo@example.com", email_subject: "Your invitation was accepted", email_content: "Welcome aboard.", email_type: "invitation", read_status: true, created_at: "2026-09-28T07:00:00", read_at: "2026-09-28T08:00:00", metadata: { url: "https://evil.example/steal" } },
    ],
    total: 3, limit: 50, offset: 0,
  },
  "GET /api/user/invitations/pending": [{ token: "inv-7f3a", role: "board_member", invited_by_name: "Naledi Khotle", created_at: "2026-10-01T09:00:00", expires_at: "2026-10-31T09:00:00", position: "Director", message: "Welcome to the board." }],
} as Record<string, unknown>;
