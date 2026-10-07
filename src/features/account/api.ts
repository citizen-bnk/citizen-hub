import { api } from "@/platform/api/http";

export type Contact = { contact_type: "email" | "mobile"; contact_value: string };
export const sendCode = (c: Contact) => api.post("/otp/send", c);
export const verifyCode = (c: Contact & { otp_code: string }) => api.post("/otp/verify", c);

