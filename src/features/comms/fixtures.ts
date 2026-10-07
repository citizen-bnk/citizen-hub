/** API responses the Communications screens read, for the render test (`npm run test:render`). */
const feature = (id: string, name: string, category: string, sent: number, active = true) => ({
  id, name, description: `${name}: a short description for board members.`,
  detailed_explanation: `${name} lets you do more from one place, with a clear record of what happened.`,
  feature_image_url: null, cta_text: "Try it now", cta_url: "https://hub.citizenbank.test/", category, is_active: active,
  times_sent: sent, last_sent_at: sent ? "2026-09-15T08:00:00Z" : null,
});

const draft = (id: number, name: string, status: string) => ({
  id, recipient_name: name, recipient_email: `${name.split(" ")[0].toLowerCase()}@example.com`,
  subject_line: `${name.split(" ")[0]}, see what is new on the Citizen Hub`, status, scheduled_send_date: "2026-10-08", created_at: "2026-10-06T09:30:00Z",
});

const sent = (id: number, status: string, name: string, error: string | null = null) => ({
  id, email_id: `EM-${id}`, queue_id: `q-${id}`, recipient_email: `${name.split(" ")[0].toLowerCase()}@example.com`, recipient_name: name,
  subject: "Your subscription certificate", body_html: "<p>Dear member, your certificate is attached.</p>", template_name: "Certificate issued",
  status, sent_at: status === "sent" ? "2026-10-05T10:00:00Z" : null, sent_by: "system", created_at: "2026-10-05T09:59:00Z",
  last_error: error, retry_count: status === "failed" ? 3 : 0,
});

const template = (id: number, name: string, category: string, type: string, active = true) => ({
  id, template_name: name, category, subject: `${name} - Citizen Bank`, template_type: type, function_name: type === "hardcoded" ? "create_x_email" : null,
  trigger_points: [{ event: "A subscription is paid", module: "subscriptions" }], process_flow: "Queued after the event, sent within a minute.",
  can_edit: type !== "hardcoded", is_active: active, usage_count: 12 * id, created_at: "2026-01-10T08:00:00Z", updated_at: "2026-08-01T08:00:00Z",
});

export default {
  "GET /api/stats": {
    total_sent: 48, total_opened: 31, total_clicked: 12, open_rate: 64.58, click_rate: 25, avg_opens_per_email: 1.7, total_eligible_recipients: 9,
    recent_sends: [{ id: 1, recipient_name: "Thabo Mokoena", sent_at: "2026-09-15T08:00:00Z", opened_count: 2, clicked_count: 1 }],
  },
  "GET /api/engagement-config": { auto_send_enabled: false, send_time: "09:00:00", default_channels: ["email"] },
  "GET /api/features": [
    feature("f1", "Vote from your phone", "governance", 3),
    feature("f2", "Compliance document checklist", "compliance", 1),
    feature("f3", "Investor data room", "investment", 0),
    feature("f4", "Old dashboard", "platform", 5, false),
  ],
  "GET /api/drafts": [draft(1, "Thabo Mokoena", "draft"), draft(2, "Lerato Nkosi", "approved"), draft(3, "Pule Sebata", "sent"), draft(4, "Mpho Letsie", "cancelled")],
  "GET /api/email-templates/queue/status": { success: true, queue_stats: { pending: 2, retrying: 1, sent: 140, failed: 3, total: 146 } },
  "POST /api/email-templates/sent-items/list": {
    total_count: 3,
    emails: [sent(1, "sent", "Thabo Mokoena"), sent(2, "failed", "Lerato Nkosi", "550 mailbox unavailable"), sent(3, "pending", "Pule Sebata")],
  },
  "GET /api/email-templates/registry/list": [
    template(1, "Payment instructions", "payments", "hardcoded"),
    template(2, "Certificate issued", "certificates", "hardcoded"),
    template(3, "Board meeting reminder", "meetings", "dynamic", false),
  ],
  "GET /api/media-releases/list": [
    { id: 1, title: "Citizen Bank opens its share offer", slug: "share-offer", excerpt: "Class B shares are now open to members.", featured_image_url: null, status: "published", published_at: "2026-09-01T08:00:00Z", created_at: "2026-08-30T08:00:00Z", email_sent: true, view_count: 120 },
    { id: 2, title: "Annual general meeting notice", slug: "agm-notice", excerpt: "The AGM is on 30 November.", featured_image_url: null, status: "draft", published_at: null, created_at: "2026-10-02T08:00:00Z", email_sent: false, view_count: 0 },
  ],
  "GET /api/media-releases/:id": {
    id: 2, title: "Annual general meeting notice", slug: "agm-notice", excerpt: "The AGM is on 30 November.", content: "Members are invited to the AGM.",
    featured_image_url: null, author_id: "u1", author_name: "staff@citizenbank.test", status: "draft", published_at: null,
    created_at: "2026-10-02T08:00:00Z", updated_at: "2026-10-02T08:00:00Z", email_sent: false, email_sent_at: null, view_count: 0,
  },
  "GET /api/achievements/admin": {
    total: 2,
    achievements: [
      { id: 1, title: "Licence application submitted", description: "The application went to the Central Bank of Lesotho.", achievement_date: "2026-06-15", category: "regulatory", image_url: "achievements/achievement_1_licence.png", display_order: 1, is_published: true, created_at: "2026-06-16T08:00:00Z", updated_at: "2026-06-16T08:00:00Z", created_by: "u1" },
      { id: 2, title: "1,000 members", description: "We reached one thousand members.", achievement_date: "2026-09-20", category: "community", image_url: null, display_order: 2, is_published: false, created_at: "2026-09-21T08:00:00Z", updated_at: "2026-09-21T08:00:00Z", created_by: "u1" },
    ],
  },
  "GET /api/progress-timeline/admin/list": [
    { id: 1, title: "Founders' meeting", short_story: "The founding group met to agree the plan.", achievement_date: "2025-03-01", image_url: null, status: "completed", display_order: 1, is_published: true, created_by: "u1", created_at: "2025-03-02T08:00:00Z", updated_at: "2025-03-02T08:00:00Z", comment_count: 2 },
    { id: 2, title: "First branch opens", short_story: "The first branch opens in Maseru.", achievement_date: "2027-01-15", image_url: null, status: "upcoming", display_order: 2, is_published: false, created_by: "u1", created_at: "2026-09-02T08:00:00Z", updated_at: "2026-09-02T08:00:00Z", comment_count: 0 },
  ],
  "GET /api/newsletters/admin/list": [
    { id: 5, slug: "monthly-oct-2026", issue_no: 5, series: "Monthly", title: "Monthly update, October 2026", published_on: "2026-10-01", period_label: "October 2026", summary: "Progress on the licence application.", sections: [{ heading: "Where we are", points: ["Application with the regulator", "Platform in testing"] }], visibility: "members", status: "draft", has_file: false, file_name: null, file_bytes: null, external_url: null },
    { id: 4, slug: "quarterly-aug-2026", issue_no: 4, series: "Quarterly Review", title: "Quarterly review, August 2026", published_on: "2026-08-15", period_label: "Q2 2026", summary: "A look at the quarter.", sections: [], visibility: "public", status: "published", has_file: true, file_name: "quarterly-review.pdf", file_bytes: 900000, external_url: null },
    { id: 3, slug: "monthly-jul-2026", issue_no: 3, series: "Monthly", title: "Monthly update, July 2026", published_on: null, period_label: null, summary: "", sections: [], visibility: "internal", status: "draft", has_file: false, file_name: null, file_bytes: null, external_url: "https://drive.example.test/july" },
  ],
  "GET /api/careers/admin/list": [
    { id: 11, slug: "compliance-officer", title: "Compliance Officer", department: "Compliance", employment_type: "Full-time", location: "Maseru", summary: "Support the licence application and future compliance.", responsibilities: ["Maintain the compliance register", "Prepare board compliance reports"], requirements: ["Degree in law or finance", "3 years in compliance"], how_to_apply: "Email your CV and a cover letter.", closing_date: null, status: "draft", wording_confirmed: false, approved_by: null, approved_at: null, source_note: "Wording changed: 'the bank' replaced by 'the proposed Citizen Bank (licence application in progress)'." },
    { id: 12, slug: "software-engineer", title: "Software Engineer", department: "Technology", employment_type: "Full-time", location: "Maseru", summary: "Build the platform.", responsibilities: ["Build features"], requirements: ["Experience with TypeScript"], how_to_apply: null, closing_date: "2026-12-01", status: "published", wording_confirmed: true, approved_by: "admin@example.com", approved_at: "2026-10-01T08:00:00Z", source_note: null },
  ],
} as Record<string, unknown>;
