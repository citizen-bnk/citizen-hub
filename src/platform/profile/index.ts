import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "../api/http";

/**
 * THE profile: one record per person, read and written only through /users/profile. Every feature that needs a name, email,
 * phone or ID number reads it here (never asks for it again); the Account screen is the only place it is edited.
 * Stack Auth is just the login; the display name comes from here once the person has a profile.
 */
export type Profile = Record<string, string | number | boolean | null> & {
  user_id: string;
  email: string;
  full_name: string;
  phone: string;
  id_number: string;
  account_type: string;
  status: string;
  version: number;
  email_verified: boolean | null;
  mobile_verified: boolean | null;
  profile_completion_percentage: number | null;
};

export const PROFILE_KEY = ["profile"] as const;

export const getProfile = () => api.get<Profile>("/users/profile");
export const saveProfile = (body: Record<string, unknown>) => api.put<Profile>("/users/profile", body);
export const registerProfile = (body: Record<string, unknown>) => api.post<Profile>("/users/register", body);

/** `silent`: someone who has not registered yet has no profile (404); screens show the setup prompt instead of an error. */
export function useProfile() {
  return useQuery({ queryKey: PROFILE_KEY, queryFn: getProfile, meta: { silent: true }, retry: false, staleTime: 60_000 });
}

/** The fields other screens need before they can act for the person (buy shares, sign). */
export const CORE_FIELDS = ["full_name", "email", "phone", "id_number"] as const;
export const missingCore = (p: Partial<Profile> | null | undefined): string[] =>
  CORE_FIELDS.filter((k) => !String(p?.[k] ?? "").trim());

/** One rule per field, shared by every form that collects it. */
export const person = {
  fullName: z.string().trim().min(2, "Enter the full name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a phone number, with country code if outside Lesotho"),
  idNumber: z.string().trim().min(5, "Enter the ID or passport number").max(40),
};
