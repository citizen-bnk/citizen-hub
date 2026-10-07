/** API responses the Settings screen reads on load, for the render test. */
const cls = (id: number, class_name: string, display_name: string, description: string, price: number, min: number, max: number, offer: number, issued: number, is_default = false) => ({
  id, class_name, display_name, description, price_per_share: price, currency: "LSL", min_shares: min, max_shares: max,
  shares_on_offer: offer, shares_issued: issued, available_shares: offer - issued, is_default, is_active: true,
  created_at: "2026-01-05T08:00:00", updated_at: "2026-09-20T12:30:00",
});

export default {
  "GET /api/share-classes/admin": [
    cls(1, "Class A", "Class A ordinary shares", "Voting shares for founding and strategic investors", 25, 400, 40000, 2_000_000, 640_000),
    cls(2, "Class B", "Class B ordinary shares", "Public offer shares for Basotho investors", 10, 100, 100000, 5_000_000, 1_250_000, true),
    cls(3, "Class C", "Class C board shares", "Shares reserved for board members", 10, 1000, 50000, 500_000, 120_000),
  ],
  "GET /api/bank-accounts/list-bank-accounts": [
    { id: 1, account_name: "Citizen Bank Share Subscriptions", bank_name: "Standard Lesotho Bank", account_number: "9080012345", branch_code: "060667", branch_name: "Maseru Main", swift_code: "SBICLSMX", currency: "LSL", is_active: true, is_default: true, description: "Use your subscription number as the reference" },
    { id: 2, account_name: "Citizen Bank USD Collections", bank_name: "Nedbank Lesotho", account_number: "1100456789", branch_code: "190010", branch_name: null, swift_code: null, currency: "USD", is_active: false, is_default: false, description: null },
  ],
  "GET /api/back-office/crypto-wallets": {
    wallets: [
      { id: 1, crypto_type: "BTC", wallet_address: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq", network_info: "Bitcoin mainnet", is_active: true, created_at: "2026-06-01T08:00:00", updated_at: "2026-06-01T08:00:00" },
      { id: 2, crypto_type: "USDT", wallet_address: "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE", network_info: "Tron (TRC-20)", is_active: true, created_at: "2026-06-01T08:05:00", updated_at: "2026-07-14T10:00:00" },
    ],
  },
} as Record<string, unknown>;
