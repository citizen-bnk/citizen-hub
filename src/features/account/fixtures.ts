/** API responses the account screens and the To do tile read on load, for the render test. */
export const profile = {
  user_id: "u1", email: "thabo@example.com", full_name: "Thabo Mokoena", phone: "+266 5800 1234", id_number: "LS123456", account_type: "personal", status: "active",
  created_at: "2026-02-10T08:00:00", version: 4, street_address: "12 Kingsway Road", city: "Maseru", state_province: "Maseru", postal_code: "100", country: "Lesotho",
  date_of_birth: "1988-04-02", gender: "male", nationality: "Lesotho", citizenship_status: null, occupation: "Civil engineer", employer: "Roads Directorate",
  linkedin_profile: "https://www.linkedin.com/in/thabo-mokoena", source_of_funds: "Salary", investor_type: "individual", investment_purpose: "Long-term growth",
  business_name: null, company_registration_number: null, tax_id: null, email_verified: true, mobile_verified: false, profile_completion_percentage: 85,
  profile_picture_selfie_url: null, profile_picture_half_body_url: null, bio: null,
};

export default {
  "GET /api/users/profile": profile,
  "GET /api/notification-preferences/my-preferences": {
    user_id: "u1", channel_sms: false, channel_email: true, channel_push: true, channel_whatsapp: false, phone_number: null, whatsapp_number: null,
    quiet_hours_start: "22:00:00", quiet_hours_end: "07:00:00", timezone: "Africa/Maseru", created_at: "2026-02-10T08:00:00", updated_at: "2026-09-01T08:00:00",
  },
  "GET /api/notifications": {
    notifications: [
      { id: 21, recipient_email: "thabo@example.com", email_subject: "Payment due for SUB-20260901-AB12CD34", email_content: "<p>Your next instalment of LSL 15,000.00 is due on 15 November.</p>", email_type: "payment_reminder", read_status: false, created_at: "2026-10-05T07:00:00", read_at: null, metadata: { url: "/portfolio/SUB-20260901-AB12CD34" } },
      { id: 20, recipient_email: "thabo@example.com", email_subject: "Upload your board documents", email_content: "Three required documents are still missing.", email_type: "board_documents", read_status: false, created_at: "2026-10-03T07:00:00", read_at: null, metadata: { url: "/board-documents" } },
    ],
    total: 2, limit: 10, offset: 0,
  },
  "GET /api/user/invitations/pending": [{ token: "inv-7f3a", role: "board_member", invited_by_name: "Naledi Khotle", created_at: "2026-10-01T09:00:00", expires_at: "2026-10-31T09:00:00", position: "Director", message: "Welcome to the board." }],
  "GET /api/subscriptions/core/my-public-subscriptions": { summary: {}, subscriptions: [], has_admin_created_subscriptions: false }, // the investments tile on Home
} as Record<string, unknown>;
