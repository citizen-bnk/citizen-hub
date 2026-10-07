const env = import.meta.env;
/** The public website (sign-in, public pages, and every screen that has not moved to the Hub yet). */
export const WEBSITE_URL = ((env.VITE_WEBSITE_URL as string | undefined) ?? "https://citizenbank.co.ls").replace(/\/+$/, "");
export const websiteUrl = (path: string) => `${WEBSITE_URL}${path.startsWith("/") && !path.startsWith("//") ? path : "/"}`;
