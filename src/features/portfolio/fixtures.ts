/** API responses the portfolio screens read on load, for the render test. */
// Same profile as the account fixtures, so either feature can be tested alone.
const profile = {
  user_id: "u1", email: "thabo@example.com", full_name: "Thabo Mokoena", phone: "+266 5800 1234", id_number: "LS123456", account_type: "personal", status: "active",
  created_at: "2026-02-10T08:00:00", version: 4, street_address: "12 Kingsway Road", city: "Maseru", state_province: "Maseru", postal_code: "100", country: "Lesotho",
  date_of_birth: "1988-04-02", gender: "male", nationality: "Lesotho", citizenship_status: null, occupation: "Civil engineer", employer: "Roads Directorate",
  linkedin_profile: "https://www.linkedin.com/in/thabo-mokoena", source_of_funds: "Salary", investor_type: "individual", investment_purpose: "Long-term growth",
  business_name: null, company_registration_number: null, tax_id: null, email_verified: true, mobile_verified: false, profile_completion_percentage: 85,
  profile_picture_selfie_url: null, profile_picture_half_body_url: null, bio: null,
};
const subs = [
  { id: 1, subscription_id: "SUB-20260901-AB12CD34", user_id: "u1", full_name: "Thabo Mokoena", email: "thabo@example.com", num_shares: 5000, share_class: "Class B", total_amount: "50000.00", amount_paid: "20000.00", payment_method: "installment", payment_status: "partial", status: "partial", certificate_number: null, certificate_url: null, payment_deadline: "2026-11-15T00:00:00", created_at: "2026-09-01T09:30:00", created_by_admin: false },
  { id: 2, subscription_id: "SUB-20260301-EF56GH78", user_id: "u1", full_name: "Thabo Mokoena", email: "thabo@example.com", num_shares: 2000, share_class: "Class B", total_amount: "20000.00", amount_paid: "20000.00", payment_method: "one-time", payment_status: "paid", status: "completed", certificate_number: "CERT-2026-0042", certificate_url: null, payment_deadline: null, created_at: "2026-03-01T11:00:00", created_by_admin: false },
];
const options = { price_per_share: 10, min_subscription: 1000, max_subscription: 100000, remaining: 4_000_000 };

export default {
  "GET /api/notifications": { notifications: [], total: 0, limit: 10, offset: 0 }, // the To do tile on Home
  "GET /api/user/invitations/pending": [],
  "GET /api/subscriptions/core/my-public-subscriptions": { summary: {}, subscriptions: subs, has_admin_created_subscriptions: false },
  "GET /api/subscriptions/core/subscription/:id/details": {
    subscription: { subscription_id: "SUB-20260901-AB12CD34", full_name: "Thabo Mokoena", email: "thabo@example.com", phone: "+266 5800 1234", id_number: "LS123456", num_shares: 5000, share_class: "Class B", total_amount: 50000, amount_paid: 20000, payment_method: "installment", payment_status: "partial", status: "partial", created_at: "2026-09-01T09:30:00" },
    payments: [{ id: 11, payment_reference: "EFT-88213", amount: 20000, payment_method: "Bank Transfer", payment_date: "2026-09-12T00:00:00", status: "verified", verified_by: "staff", verified_at: "2026-09-13T08:00:00", notes: null, created_at: "2026-09-12T10:00:00" }],
    certificate: null,
  },
  "GET /api/certificate-requests/my-requests": { requests: [], total_count: 0 },
  "GET /api/bank-accounts/get-default-bank-account": { id: 1, account_name: "Citizen Bank (Pty) Ltd", bank_name: "Standard Lesotho Bank", account_number: "9100123456", branch_code: "060667", branch_name: "Maseru Main", swift_code: "SBICLSMX", currency: "LSL", is_active: true, is_default: true, description: null },
  "GET /api/crypto-wallets/available": { available_cryptos: [{ crypto_type: "USDT", network_info: "TRC20" }, { crypto_type: "BTC", network_info: "Bitcoin mainnet" }] },
  "GET /api/crypto-wallets/:type/details": { crypto_type: "USDT", wallet_address: "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE", network_info: "TRC20" },
  "GET /api/subscriptions/core/availability": { total_authorized: 10_000_000, total_issued: 1_000_000, available_for_subscription: 5_000_000, offered_for_public: 5_000_000, subscribed: 1_000_000, remaining: 4_000_000, ...options, fundraising_target: 50_000_000, amount_raised: 10_000_000, subscription_percentage: 20 },
  "GET /api/board/investment-options": {
    share_classes: [
      { name: "Class C", description: "Internal shares, exclusive to board members and employees", min_shares: 1000, max_shares: 100000, price_per_share: 10, restricted: true, highlighted: true, benefits: ["Special voting rights"] },
      { name: "Class A", description: "Preference shares: fixed dividend rate", min_shares: 1000, max_shares: 100000, price_per_share: 10, restricted: false, highlighted: false, benefits: [] },
      { name: "Class B", description: "Ordinary shares: voting rights and dividends", min_shares: 1000, max_shares: 100000, price_per_share: 10, restricted: false, highlighted: false, benefits: [] },
    ],
    offering_details: { target_amount: 50_000_000, current_amount: 10_000_000, min_shares: 1000, max_shares: 100000, share_price: 10, offering_status: "open" },
    board_member_status: "active",
    class_c_access: true,
  },
  "GET /api/users/profile": profile,
} as Record<string, unknown>;
