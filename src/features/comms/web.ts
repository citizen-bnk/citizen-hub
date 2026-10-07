import { api } from "@/platform/api/http";

// ---- newsletters (staff side of /newsletters) ------------------------------------------------------------------------

export type Visibility = "public" | "members" | "internal";
export type SectionBody = { heading: string; points: string[] };
export type Newsletter = {
  id: number; slug: string; issue_no: number | null; series: string; title: string; published_on: string | null; period_label: string | null;
  summary: string; sections: unknown; visibility: Visibility; status: "draft" | "published"; has_file: boolean; file_name: string | null;
  file_bytes: number | null; external_url: string | null; updated_at?: string;
};
export type NewsletterBody = {
  title: string; series: string; issue_no: number | null; published_on: string | null; period_label: string | null;
  summary: string | null; sections: SectionBody[]; external_url: string | null;
};

export const newsletters = {
  list: () => api.get<Newsletter[]>("/newsletters/admin/list"),
  create: (b: NewsletterBody) => api.post<Newsletter>("/newsletters/admin", b),
  update: ({ id, ...b }: NewsletterBody & { id: number }) => api.put<Newsletter>(`/newsletters/admin/${id}`, b),
  remove: (id: number) => api.delete(`/newsletters/admin/${id}`),
  upload: ({ id, file }: { id: number; file: File }) => {
    const body = new FormData();
    body.append("file", file);
    return api.post<Newsletter>(`/newsletters/admin/${id}/file`, body);
  },
  publish: (v: { id: number; visibility: Visibility }) => api.post<Newsletter>(`/newsletters/admin/${v.id}/publish`, { visibility: v.visibility }),
  unpublish: (id: number) => api.post<Newsletter>(`/newsletters/admin/${id}/unpublish`),
};

// ---- careers (staff side of /careers) --------------------------------------------------------------------------------

export type Advert = {
  id: number; slug: string; title: string; department: string | null; employment_type: string | null; location: string | null; summary: string | null;
  responsibilities: string[]; requirements: string[]; how_to_apply: string | null; closing_date: string | null;
  status: "draft" | "published" | "closed"; wording_confirmed: boolean; approved_by: string | null; approved_at: string | null; source_note: string | null;
};
export type AdvertBody = {
  title: string; department: string | null; employment_type: string | null; location: string | null; summary: string | null;
  responsibilities: string[]; requirements: string[]; how_to_apply: string | null; closing_date: string | null;
};

export const careers = {
  list: () => api.get<Advert[]>("/careers/admin/list"),
  create: (b: AdvertBody) => api.post<Advert>("/careers/admin", b),
  update: ({ id, ...b }: AdvertBody & { id: number }) => api.put<Advert>(`/careers/admin/${id}`, b),
  remove: (id: number) => api.delete(`/careers/admin/${id}`),
  publish: (id: number) => api.post<Advert>(`/careers/admin/${id}/publish`, { confirm_wording: true }),
  close: (id: number) => api.post<Advert>(`/careers/admin/${id}/close`),
};
