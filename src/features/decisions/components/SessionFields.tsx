import { Field } from "@/platform/ui/kit";
import { SESSION_TYPES, type SessionForm } from "../logic";
import { Select } from "./Select";

/** The session form's fields, for creating (type can be chosen) and editing a draft (type is fixed). */
export default function SessionFields({ form, set, errors, lockType }: { form: SessionForm; set: (p: Partial<SessionForm>) => void; errors: Record<string, string>; lockType?: boolean }) {
  const meeting = form.session_type === "board_meeting";
  return (
    <div className="space-y-4">
      {!lockType && <Select label="Kind of session" value={form.session_type} onChange={(v) => set({ session_type: v as SessionForm["session_type"] })} options={SESSION_TYPES} />}
      <Field label="Title" value={form.title} onChange={(e) => set({ title: e.target.value })} error={errors.title} />
      <Field label="Description" multiline value={form.description} onChange={(e) => set({ description: e.target.value })} error={errors.description} />
      {meeting ? (
        <>
          <Field label="Meeting date and time" type="datetime-local" value={form.meeting_date} onChange={(e) => set({ meeting_date: e.target.value })} error={errors.meeting_date} />
          <Field label="Location" value={form.meeting_location} onChange={(e) => set({ meeting_location: e.target.value })} />
        </>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Voting opens" type="datetime-local" value={form.opens_at} onChange={(e) => set({ opens_at: e.target.value })} error={errors.opens_at} />
          <Field label="Voting closes" type="datetime-local" value={form.closes_at} onChange={(e) => set({ closes_at: e.target.value })} error={errors.closes_at} />
        </div>
      )}
    </div>
  );
}
