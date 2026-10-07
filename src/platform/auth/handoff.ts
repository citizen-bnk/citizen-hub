import { api } from "../api/http";

/** Asks the website for a one-time link into Internet Banking or the App, and returns the address to open. */
export async function startHandoff(audience: "banking" | "app", next = "/"): Promise<string> {
  return (await api.post<{ url: string }>("/platform/handoff", { audience, next })).url;
}
