import { Field } from "@/platform/ui/kit";
import { label } from "@/platform/format";
import { MEETING_TYPES, type MeetingForm } from "../logic";
import { Select } from "./Select";

/** The meeting form's fields, shared by "New meeting" and "Edit". */
export default function MeetingFields({ form, set, errors }: { form: MeetingForm; set: (patch: Partial<MeetingForm>) => void; errors: Record<string, string> }) {
  return (
    <div className="space-y-4">
      <Field label="Title" value={form.title} onChange={(e) => set({ title: e.target.value })} error={errors.title} />
      <Select label="Type" value={form.meeting_type} onChange={(v) => set({ meeting_type: v as MeetingForm["meeting_type"] })} options={MEETING_TYPES.map((t) => ({ value: t, label: label(t) }))} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date" type="date" value={form.meeting_date} onChange={(e) => set({ meeting_date: e.target.value })} error={errors.meeting_date} />
        <Field label="Time" type="time" value={form.meeting_time} onChange={(e) => set({ meeting_time: e.target.value })} error={errors.meeting_time} />
      </div>
      <Field label="Location" value={form.location} onChange={(e) => set({ location: e.target.value })} error={errors.location} />
      <Field label="Video link" placeholder="https://" value={form.virtual_link} onChange={(e) => set({ virtual_link: e.target.value })} error={errors.virtual_link} />
      <Field label="Description" multiline value={form.description} onChange={(e) => set({ description: e.target.value })} error={errors.description} />
    </div>
  );
}
