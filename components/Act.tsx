"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

/** Posts a JSON action, then refreshes the page so the server-rendered state is current. Shows the server's reason on failure. */
export function useAct(path: string) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function act(payload: Record<string, unknown>): Promise<boolean> {
    setBusy(true); setError(null);
    try {
      const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "This action could not be completed. Please try again.");
      router.refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "This action could not be completed. Please try again.");
      return false;
    } finally { setBusy(false); }
  }
  return { act, busy, error, clear: () => setError(null) };
}

export function Act({ label, path, payload, className = "button", confirm }: { label: string; path: string; payload: Record<string, unknown>; className?: string; confirm?: string }) {
  const { act, busy, error } = useAct(path);
  return <span className="action-wrapper">
    <button className={className} disabled={busy} onClick={() => { if (!confirm || window.confirm(confirm)) void act(payload); }}>{busy ? "Working…" : label}</button>
    {error && <span className="inline-error" role="alert">{error}</span>}
  </span>;
}
