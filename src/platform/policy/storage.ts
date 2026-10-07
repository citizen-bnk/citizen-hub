/** The last good response, kept so a reload while the backend is slow or down still shows the real wording. Optional: any failure is ignored. */
const KEY = "citizenhub-policy-v1";

export function loadStored(): unknown {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

export function saveStored(value: unknown): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* private window, blocked or full storage: the policy still works from memory */
  }
}
