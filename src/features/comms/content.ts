import { api } from "@/platform/api/http";
import type { FieldDef } from "./logic";

/** One public-content item as the editor lists it, whichever kind it is. `raw` is what the backend sent. */
export type ContentItem = { id: number; title: string; sub: string; date: string | null; status: string; published: boolean; raw: Record<string, unknown> };

/**
 * The three kinds of public content differ only in this table: where the list, create, update and delete calls go, the form
 * fields, and how "published" is expressed. The editor (components/ContentEditor) is written once and reads this.
 */
export type ContentKind = {
  key: string;
  label: string;
  noun: string;
  fields: FieldDef[];
  /** Cache key for the list. */
  list: () => Promise<ContentItem[]>;
  /** Full record for the edit form, when the list holds only a summary. */
  detail?: (id: number) => Promise<Record<string, unknown>>;
  create: (body: Record<string, unknown>) => Promise<unknown>;
  update: (id: number, body: Record<string, unknown>) => Promise<unknown>;
  remove: (id: number) => Promise<unknown>;
  /** How "Publish" works: its own backend route (press releases send the newsletter), or flipping `is_published`. */
  publish: (id: number) => Promise<unknown>;
  publishWarning?: string;
  /** Achievements keep their image in the backend's storage; it can only be uploaded for an item that exists. */
  uploadImage?: (id: number, file: File) => Promise<unknown>;
};

type Rec = Record<string, unknown>;
const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));

const release: ContentKind = {
  key: "releases", label: "Press releases", noun: "press release",
  fields: [
    { name: "title", label: "Title", required: true },
    { name: "excerpt", label: "Summary", type: "textarea" },
    { name: "content", label: "Text", type: "textarea", required: true },
    { name: "featured_image_url", label: "Image address", type: "url" },
  ],
  list: async () =>
    (await api.get<Rec[]>("/media-releases/list", { limit: 100 })).map((r) => ({
      id: Number(r.id), title: s(r.title), sub: s(r.excerpt), date: (r.published_at ?? r.created_at) as string | null, status: s(r.status),
      published: r.status === "published", raw: r,
    })),
  detail: (id) => api.get<Rec>(`/media-releases/${id}`),
  create: (b) => api.post("/media-releases/create", b),
  update: (id, b) => api.put(`/media-releases/${id}`, b),
  remove: (id) => api.delete(`/media-releases/${id}`),
  publish: (id) => api.post(`/media-releases/${id}/publish`),
  publishWarning: "Publishing emails the release to board members and adds a notification for them.",
};

const achievement: ContentKind = {
  key: "achievements", label: "Achievements", noun: "achievement",
  fields: [
    { name: "title", label: "Title", required: true },
    { name: "description", label: "Description", type: "textarea", required: true },
    { name: "achievement_date", label: "Date", type: "date", required: true },
    { name: "category", label: "Category", required: true },
    { name: "display_order", label: "Display order", type: "number" },
  ],
  list: async () =>
    (await api.get<{ achievements: Rec[] }>("/achievements/admin")).achievements.map((r) => ({
      id: Number(r.id), title: s(r.title), sub: s(r.category), date: s(r.achievement_date), status: r.is_published ? "published" : "draft",
      published: !!r.is_published, raw: r,
    })),
  create: (b) => api.post("/achievements/admin", { ...b, is_published: false }),
  update: (id, b) => api.put(`/achievements/admin/${id}`, b),
  remove: (id) => api.delete(`/achievements/admin/${id}`),
  publish: (id) => api.put(`/achievements/admin/${id}`, { is_published: true }),
  uploadImage: (id, file) => {
    const form = new FormData();
    form.append("file", file);
    return api.post(`/achievements/admin/${id}/upload-image`, form);
  },
};

const timeline: ContentKind = {
  key: "timeline", label: "Progress timeline", noun: "timeline item",
  fields: [
    { name: "title", label: "Title", required: true, max: 255 },
    { name: "short_story", label: "Story", type: "textarea", required: true },
    { name: "achievement_date", label: "Date", type: "date", required: true },
    { name: "status", label: "Progress", type: "select", options: ["upcoming", "in_progress", "completed"], required: true },
    { name: "image_url", label: "Image address", type: "url" },
    { name: "display_order", label: "Display order", type: "number" },
  ],
  list: async () =>
    (await api.get<Rec[]>("/progress-timeline/admin/list")).map((r) => ({
      id: Number(r.id), title: s(r.title), sub: s(r.status).replace("_", " "), date: s(r.achievement_date), status: r.is_published ? "published" : "draft",
      published: !!r.is_published, raw: r,
    })),
  create: (b) => api.post("/progress-timeline/admin/create", { ...b, is_published: false }),
  update: (id, b) => api.put(`/progress-timeline/admin/${id}`, b),
  remove: (id) => api.delete(`/progress-timeline/admin/${id}`),
  publish: (id) => api.put(`/progress-timeline/admin/${id}`, { is_published: true }),
};

export const CONTENT_KINDS: readonly ContentKind[] = [release, achievement, timeline];
