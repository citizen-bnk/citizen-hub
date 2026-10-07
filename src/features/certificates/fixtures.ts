/** API responses the Certificates screens read, for the render test (`npm run test:render`). */
const cert = (id: number, name: string, shares: number, cls: string, status: string, issued: string) => ({
  id, certificate_number: `CB-2026-${String(id).padStart(4, "0")}`, subscription_id: 100 + id, user_id: `user-${id}`, full_name: name,
  shares_count: shares, share_class: cls, issue_date: issued, certificate_url: `https://citizenbank.example/certificates/CB-2026-${id}/abc`,
  verification_code: "A1B2C3D4", issued_by: "staff-1", status, created_at: `${issued}T10:00:00`,
});

const certificates = [
  cert(1, "Palesa Ramohlanka", 1000, "Class B", "active", "2026-09-16"),
  cert(2, "Thabo Mokoena", 500, "Class B", "active", "2026-09-20"),
  cert(3, "Retšelisitsoe Mohale", 2000, "Class C", "active", "2026-09-22"),
  cert(4, "Lerato Nkosi", 200, "Class A", "revoked", "2026-09-25"),
];

export default {
  // Home shows the Subscriptions tile for the same roles, so a run of this feature alone needs its list too.
  "GET /api/subscriptions/core/subscriptions": { total_subscriptions: 0, subscriptions: [] },
  "GET /api/certificate-management/certificates": { certificates, total_count: certificates.length, filters_applied: {} },
  "GET /api/certificate-management/statistics": { total_certificates: 4, active_certificates: 3, revoked_certificates: 1, total_shares_certified: 3700, unique_shareholders: 4, template_based_certs: 3, legacy_certs: 1 },
  "GET /api/certificate-templates/list": [
    { id: 2, template_name: "Citizen Bank certificate 2026", is_active: true, created_by: "admin-1", created_at: "2026-08-01T09:00:00", version: 2, description: "Fillable PDF with signature block", template_type: "pdf", share_class: null },
    { id: 1, template_name: "Citizen Bank certificate (first)", is_active: false, created_by: "admin-1", created_at: "2026-05-12T09:00:00", version: 1, description: null, template_type: "pdf", share_class: null },
  ],
} as Record<string, unknown>;
