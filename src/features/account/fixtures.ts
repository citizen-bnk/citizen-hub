/** API responses the account screens read on load, for the render test. */
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
  "GET /api/subscriptions/core/my-public-subscriptions": { summary: {}, subscriptions: [], has_admin_created_subscriptions: false }, // the investments tile on Home
} as Record<string, unknown>;
