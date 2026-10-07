import { api } from "@/platform/api/http";
import type { SignValues } from "./logic";

type Raw = Record<string, unknown>;
export type Template = { id: number; template_name: string; is_active: boolean; created_at: string; version: number; description: string | null; share_class: string | null };

// The list and "reactivate" exist only in certificate-management; every other write uses subscriptions/certificates, which
// is the module that issues certificates and keeps their PDFs, so what it changes is what gets downloaded.
export const listCertificates = () => api.get<{ certificates: Raw[]; total_count: number }>("/certificate-management/certificates", { limit: 500 });

export const sign = (v: SignValues & { id: number }) =>
  api.post(`/subscriptions/certificates/certificate/${v.id}/sign`, { signature_image: v.signature_image, signer_name: v.signer_name, signer_role: v.signer_role });
export const revoke = (v: { id: number; reason: string }) => api.post(`/subscriptions/certificates/certificate/${v.id}/revoke`, undefined, { reason: v.reason });
export const reactivate = (id: number) => api.patch(`/certificate-management/certificates/${id}/status`, { status: "active", reason: "Reactivated from the Hub" });
export const resendEmail = (id: number) => api.post(`/subscriptions/certificates/certificate/${id}/resend-email`);
export const regenerate = (id: number) => api.post(`/subscriptions/certificates/certificate/${id}/regenerate`);
export const downloadPdf = (number: string) => api.file(`/subscriptions/certificates/certificate/${number}/download`);

export const listTemplates = () => api.get<Template[]>("/certificate-templates/list");
export const activateTemplate = (id: number) => api.post(`/certificate-templates/${id}/activate`);
export const deleteTemplate = (id: number) => api.delete(`/certificate-templates/${id}`);
export const downloadTemplate = (id: number) => api.file(`/certificate-templates/download/${id}`);
export const uploadTemplate = (v: { file: File; template_name: string; description?: string }) => {
  const body = new FormData();
  body.append("file", v.file);
  body.append("template_name", v.template_name);
  if (v.description) body.append("description", v.description);
  return api.post("/certificate-templates/upload", body);
};
