const env = import.meta.env;
export const config = {
  stackProjectId: (env.VITE_STACK_PROJECT_ID as string | undefined) ?? "",
  stackPublishableKey: (env.VITE_STACK_PUBLISHABLE_CLIENT_KEY as string | undefined) ?? "",
  websiteUrl: ((env.VITE_WEBSITE_URL as string | undefined) ?? "https://citizenbank.co.ls").replace(/\/+$/, ""),
};
export const authConfigured = Boolean(config.stackProjectId && config.stackPublishableKey);
