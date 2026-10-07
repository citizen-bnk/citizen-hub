import { type QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import { saveFile } from "../api/http";

/**
 * Run something that changes data. Failure is reported once by the query client; success says `success` (if given) and
 * refreshes the queries named in `refresh`. No try/catch in the screen:
 *
 *   const approve = useAction((id: string) => api.post(`/x/${id}/approve`), { success: "Approved", refresh: [["x"]] });
 *   <Button onClick={() => approve.mutate(id)} disabled={approve.isPending}>Approve</Button>
 *
 * For a form that shows field errors itself, pass `silent: true` and read `error.fields`.
 */
export function useAction<V, R = unknown>(
  run: (variables: V) => Promise<R>,
  opts: { success?: string; refresh?: QueryKey[]; /** Refresh even when the action fails part-way (a batch where some steps already happened). */ refreshOnError?: boolean; silent?: boolean; onDone?: (result: R, variables: V) => void } = {},
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: run,
    meta: { success: opts.success, silent: opts.silent },
    onSuccess: async (result, variables) => {
      await Promise.all((opts.refresh ?? []).map((key) => qc.invalidateQueries({ queryKey: key })));
      opts.onDone?.(result, variables);
    },
    onError: async () => {
      if (opts.refreshOnError) await Promise.all((opts.refresh ?? []).map((key) => qc.invalidateQueries({ queryKey: key })));
    },
  });
}

/** An action that downloads a file: `const get = useDownload((id: string) => api.file(`/x/${id}/pdf`))`. */
export function useDownload<V>(fetchFile: (variables: V) => Promise<{ blob: Blob; name: string }>) {
  return useAction(fetchFile, { onDone: saveFile });
}
