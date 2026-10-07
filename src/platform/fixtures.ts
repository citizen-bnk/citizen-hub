/** API responses the platform itself reads (not any one feature), for the render test. */
export default {
  "GET /api/policy": {
    version: 3,
    policies: {
      "legal.footer": "Citizen Digital Ltd. Citizen Bank is an applicant for a banking licence from the Central Bank of Lesotho and does not yet carry on banking business.",
      "app.base_currency": "LSL",
      "payments.reminder_days": [7, 3, 1],
    },
    plans: [
      { code: "one-time", label: "Pay in full", months: 1, audience: "public", display_order: 1 },
      { code: "3-months", label: "3 monthly instalments", months: 3, audience: "public", display_order: 2 },
      { code: "6-months", label: "6 monthly instalments", months: 6, audience: "public", display_order: 3 },
      { code: "12-months", label: "12 monthly instalments", months: 12, audience: "public", display_order: 4 },
    ],
    lists: {
      gender: [{ code: "male", label: "Male", display_order: 1, meta: null }, { code: "female", label: "Female", display_order: 2, meta: null }, { code: "other", label: "Other", display_order: 3, meta: null }],
      investor_type: [{ code: "individual", label: "Individual", display_order: 1, meta: null }, { code: "institutional", label: "Institution", display_order: 2, meta: null }, { code: "accredited", label: "Accredited investor", display_order: 3, meta: null }],
      account_type: [{ code: "personal", label: "Personal", display_order: 1, meta: null }, { code: "business", label: "Business", display_order: 2, meta: null }],
    },
  },
} as Record<string, unknown>;
