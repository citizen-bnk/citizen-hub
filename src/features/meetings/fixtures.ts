/** API responses the meetings screens read on load (shapes from backend/app/apis/board_meetings). */
const stamp = "2026-09-01T08:00:00+00:00";
const meeting = (o: Record<string, unknown>) => ({
  id: "m1", title: "Q4 board meeting", meeting_type: "regular", meeting_date: "2030-03-14", meeting_time: "14:00:00",
  location: "Citizen Bank boardroom, Maseru", virtual_link: "https://meet.example.com/q4-board", description: "Quarterly review of the licence programme and capital plan.",
  status: "scheduled", created_by: "u-staff", created_at: stamp, updated_at: stamp, agenda_count: 3, attendance_count: 2, has_minutes: true, ...o,
});

export default {
  "GET /api/board-meetings/list": {
    meetings: [
      meeting({}),
      meeting({ id: "m2", title: "Special meeting: licence submission", meeting_type: "special", meeting_date: "2030-04-02", meeting_time: "09:30:00", location: null, agenda_count: 1, attendance_count: 0, has_minutes: false }),
      meeting({ id: "m3", title: "Q3 board meeting", meeting_date: "2026-07-10", status: "completed", virtual_link: null }),
    ],
    total_count: 3,
  },
  "GET /api/board-meetings/board-members": [
    { user_id: "u-bm1", full_name: "Thabo Mokoena", email: "thabo@example.com", position: "Chair" },
    { user_id: "u-bm2", full_name: "Lineo Sello", email: "lineo@example.com", position: "Director" },
    { user_id: "u-bm3", full_name: "Palesa Nthane", email: "palesa@example.com", position: "Director" },
  ],
  "GET /api/board-meetings/:id/agenda": [
    { id: "a1", meeting_id: "m1", item_number: 1, title: "Apologies and minutes of the last meeting", description: null, duration_minutes: 10, presenter: "Chair", attachments: [], created_at: stamp },
    { id: "a2", meeting_id: "m1", item_number: 2, title: "Banking licence progress", description: "Status of the compliance documents.", duration_minutes: 30, presenter: "Compliance", attachments: [], created_at: stamp },
    { id: "a3", meeting_id: "m1", item_number: 3, title: "Capital raise update", description: null, duration_minutes: 20, presenter: null, attachments: [], created_at: stamp },
  ],
  "GET /api/board-meetings/:id/minutes": {
    id: "min1", meeting_id: "m1", content: "1. The Chair opened the meeting at 14:05.\n2. The previous minutes were approved.\n3. The licence submission is on track for November.",
    recorded_by: "u-staff", approved: false, approved_by: null, approved_at: null, version: 1, created_at: stamp, updated_at: stamp,
  },
  "GET /api/board-meetings/:id/attendance": [
    { id: "at1", meeting_id: "m1", board_member_id: "u-bm1", status: "present", arrival_time: "14:00:00", departure_time: null, notes: null, created_at: stamp, updated_at: stamp },
    { id: "at2", meeting_id: "m1", board_member_id: "u-bm2", status: "excused", arrival_time: null, departure_time: null, notes: "Travelling", created_at: stamp, updated_at: stamp },
  ],
  "GET /api/board-meetings/:id/invitees": [
    { id: "i1", meeting_id: "m1", board_member_id: "u-bm1", email: "thabo@example.com", invited_by: "u-staff", invitation_sent_at: stamp, rsvp_status: "accepted", rsvp_at: stamp, created_at: stamp },
    { id: "i2", meeting_id: "m1", board_member_id: "u-bm2", email: "lineo@example.com", invited_by: "u-staff", invitation_sent_at: stamp, rsvp_status: "declined", rsvp_at: stamp, created_at: stamp },
    { id: "i3", meeting_id: "m1", board_member_id: "u-bm3", email: "palesa@example.com", invited_by: "u-staff", invitation_sent_at: stamp, rsvp_status: "pending", rsvp_at: null, created_at: stamp },
  ],
  "GET /api/board-meetings/:id/action-items": [
    { id: "ac1", meeting_id: "m1", title: "Send the signed licence forms to the regulator", description: null, assigned_to: "u-bm1", due_date: "2026-01-15", status: "in_progress", priority: "high", completed_at: null, completed_by: null, created_at: stamp, updated_at: stamp },
    { id: "ac2", meeting_id: "m1", title: "Circulate the capital plan", description: null, assigned_to: "u-bm3", due_date: null, status: "pending", priority: "medium", completed_at: null, completed_by: null, created_at: stamp, updated_at: stamp },
  ],
  // The detail screen asks for one meeting by id; the list above also matches /list, so this comes after it in the lookup.
  "GET /api/board-meetings/:id": meeting({}),
} as Record<string, unknown>;
