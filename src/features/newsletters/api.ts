import { api } from "@/platform/api/http";

/** One heading with its bullet points, as the staff wrote it. */
export type Section = { heading: string; points: string[] };
export type Newsletter = {
  id: number; slug: string; issue_no: number | null; series: string; title: string;
  published_on: string | null; period_label: string | null; summary: string;
  sections: unknown; has_file: boolean; file_bytes: number | null; external_url: string | null;
};

export const getNewsletters = () => api.get<Newsletter[]>("/newsletters/members");
/** The PDF with the person's sign-in; the browser cannot open it from a plain link because the address needs the token. */
export const getFile = (v: { id: number; download?: boolean }) =>
  api.file(`/newsletters/members/${v.id}/file`, v.download ? { download: 1 } : undefined);
