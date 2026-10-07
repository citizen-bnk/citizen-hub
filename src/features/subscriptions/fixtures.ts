/** API responses the Subscriptions screens read, for the render test (`npm run test:render`). */
const row = (o: Record<string, unknown>) => ({
  phone: "+266 5800 1122", payment_method: "one-time", payment_proof_verified: null, payment_proof_verified_at: null,
  payment_proof_verified_by: null, payment_proof_uploaded_at: null, payment_proof_path: null, amount_paid: 0, ...o,
});

const subscriptions = [
  row({ subscription_id: "SUB-20261001-A1B2C3D4", full_name: "Thabo Mokoena", email: "thabo@example.co.ls", num_shares: 500, total_amount: 5000, status: "active", payment_status: "proof_submitted", created_at: "2026-10-01T09:14:00", payment_proof_path: "payment_proofs/SUB-20261001-A1B2C3D4/slip.pdf", payment_proof_uploaded_at: "2026-10-02T08:00:00" }),
  row({ subscription_id: "SUB-20260928-E5F6A7B8", full_name: "Lerato Nkosi", email: "lerato@example.co.ls", num_shares: 200, total_amount: 2000, amount_paid: 800, status: "partial", payment_status: "partial", created_at: "2026-09-28T13:40:00" }),
  row({ subscription_id: "SUB-20260915-C9D0E1F2", full_name: "Palesa Ramohlanka", email: "palesa@example.co.ls", num_shares: 1000, total_amount: 10000, amount_paid: 10000, status: "completed", payment_status: "paid", created_at: "2026-09-15T10:05:00", payment_proof_verified: true }),
  row({ subscription_id: "SUB-20260910-0A1B2C3D", full_name: "Tumelo Letsie", email: "tumelo@example.co.ls", num_shares: 100, total_amount: 1000, status: "active", payment_status: "pending", created_at: "2026-09-10T16:22:00" }),
  row({ subscription_id: "SUB-20260901-4E5F6A7B", full_name: "Mpho Sekhonyana", email: "mpho@example.co.ls", num_shares: 50, total_amount: 500, status: "cancelled", payment_status: "pending", created_at: "2026-09-01T11:00:00" }),
];

const payments = [
  { id: 41, payment_reference: "FNB-88213", amount: 800, payment_method: "bank-transfer", payment_date: "2026-09-30T00:00:00", status: "verified", verified_by: "staff-1", verified_at: "2026-09-30T12:00:00", notes: null, created_at: "2026-09-30T12:00:00" },
];

export default {
  "GET /api/subscriptions/core/subscriptions": { total_subscriptions: subscriptions.length, subscriptions },
  "GET /api/my-created-subscriptions": {
    subscriptions: [{ subscription_id: "SUB-20260910-0A1B2C3D", full_name: "Tumelo Letsie", email: "tumelo@example.co.ls", phone: "+266 5800 3344", share_class: "Class B", num_shares: 100, total_amount: 1000, amount_paid: 0, status: "active", payment_status: "pending", payment_method: "one-time", created_at: "2026-09-10T16:22:00", admin_notes: null, has_payment_proof: false, profile_completed: false }],
  },
  "GET /api/back-office/board/investments/all": {
    summary: { total_board_investors: 1 },
    subscriptions: [{ id: 17, subscription_id: "SUB-20260905-BOARD001", user_id: "board-user-1", full_name: "Retšelisitsoe Mohale", position: "Chairperson", email: "chair@example.co.ls", share_class: "Class C", num_shares: 2000, total_amount: 20000, amount_paid: 0, status: "active", payment_status: "pending", payment_method: "one-time", created_at: "2026-09-05T08:30:00", payment_proof_path: null }],
  },
  "GET /api/back-office/board/members": { members: [{ user_id: "board-user-2", full_name: "Naledi Thabane", position: "Director", status: "active" }] },
  "GET /api/share-classes": {
    classes: [
      { name: "Class A", description: "Founders", price_per_share: 25, min_shares: 100, max_shares: 5000, currency: "LSL", shares_on_offer: 100000, shares_issued: 60000, available_shares: 40000 },
      { name: "Class B", description: "Public", price_per_share: 10, min_shares: 10, max_shares: 10000, currency: "LSL", shares_on_offer: 500000, shares_issued: 120000, available_shares: 380000 },
    ],
    global_config: { price_per_share: 10, min_subscription: 10, max_subscription: 10000, total_authorized: 1000000, total_issued: 180000, offered_for_public: 600000, available_shares: 420000, is_active: true },
  },
  "GET /api/subscriptions/payments/payment-history/:id": { subscription_id: "SUB-20260928-E5F6A7B8", payments },
  "GET /api/users/admin/search": { users: [{ user_id: "u1", email: "thabo@example.co.ls", full_name: "Thabo Mokoena", phone: "+266 5800 1122", status: "active", account_type: "individual", created_at: "2026-01-01T00:00:00", profile_completion_percentage: 80, roles: ["investor"] }], total: 1 },
} as Record<string, unknown>;
