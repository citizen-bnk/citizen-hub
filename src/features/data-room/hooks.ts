import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAction, useDownload } from "@/platform/ui/actions";
import * as q from "./api";
import { fileTarget, type AgreementKey, type LoiForm } from "./logic";

const KEY = "data-room";

/** Agreement state of the signed-in person: the access check and their per-agreement status. */
export function useMyAccess() {
  const access = useQuery({ queryKey: [KEY, "access"], queryFn: q.checkAccess });
  const status = useQuery({ queryKey: [KEY, "status"], queryFn: q.myStatus });
  return { access, status };
}

export const useNcnda = (enabled: boolean) => useQuery({ queryKey: [KEY, "ncnda"], queryFn: q.currentNcnda, enabled });
export const useInvestorDocuments = (enabled: boolean) => useQuery({ queryKey: [KEY, "documents"], queryFn: q.investorDocuments, enabled });

export type SignRequest = { signature: string; keys: AgreementKey[]; ncndaVersion: string; loi: LoiForm };

/** Signs the chosen agreements one after another; the status is reloaded even when one fails part-way. */
export function useSign() {
  const qc = useQueryClient();
  return useAction(
    async (v: SignRequest) => {
      try {
        for (const key of v.keys) {
          const body = { agreement_version: key === "ncnda" ? v.ncndaVersion : "1.0", digital_signature: v.signature };
          if (key === "ncnda") await q.signNcnda(body);
          else if (key === "terms") await q.signTerms(body);
          else await q.agreeLoi({ ...body, ...v.loi });
        }
      } finally {
        await qc.invalidateQueries({ queryKey: [KEY] });
      }
    },
    { success: "Agreements signed" },
  );
}

/** Logs the access with its reason, then opens or saves the file. */
export function useOpenDocument() {
  const save = useDownload((v: { key: string; name: string }) => q.fetchByKey(v.key).then((f) => ({ blob: f.blob, name: v.name })));
  return useAction(q.openDocument, {
    onDone: (res) => {
      const t = fileTarget(res.file_url, res.document_name);
      if (t.kind === "link") window.open(t.url, "_blank", "noopener");
      else save.mutate({ key: t.key, name: t.name });
    },
  });
}

// --- office side
export const useCategories = () => useQuery({ queryKey: [KEY, "categories"], queryFn: q.categories });
export const useAdminDocuments = () => useQuery({ queryKey: [KEY, "admin-documents"], queryFn: q.adminDocuments });
export const useAccessLogs = () => useQuery({ queryKey: [KEY, "access-logs"], queryFn: q.accessLogs });
export const useDocumentStats = () => useQuery({ queryKey: [KEY, "document-stats"], queryFn: q.documentStats });
export const useSignedAgreements = () => useQuery({ queryKey: [KEY, "signed"], queryFn: q.signedAgreements });
export const usePendingAgreements = () => useQuery({ queryKey: [KEY, "pending"], queryFn: q.pendingAgreements });
export const useLoiSubmissions = () => useQuery({ queryKey: [KEY, "loi"], queryFn: q.loiSubmissions });

const refresh = [[KEY]];
export const useSaveCategory = () =>
  useAction((v: { id?: number } & q.CategoryBody) => (v.id ? q.updateCategory({ ...v, id: v.id }) : q.createCategory(v)), { success: "Category saved", refresh });
export const useDeleteCategory = () => useAction(q.deleteCategory, { success: "Category deleted", refresh });
export const useDeleteDocument = () => useAction(q.deleteDocument, { success: "Document deleted", refresh });
export const useReviewLoi = () => useAction(q.reviewLoi, { success: "Review saved", refresh });

/** Uploads a file; when it replaces another document, that one is removed once the new one is stored. */
export const useUpload = () =>
  useAction(
    async (v: { form: FormData; replaceId?: number }) => {
      const saved = await q.uploadDocument(v.form);
      if (v.replaceId) await q.deleteDocument(v.replaceId);
      return saved;
    },
    { success: "Document uploaded", refresh, silent: true },
  );
