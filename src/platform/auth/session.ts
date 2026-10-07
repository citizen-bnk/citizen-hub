import { useUser } from "@stackframe/react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/http";
export { allowed } from "./roles";


export type Session = {
  /** Signed in (the sign-in library knows the person). */
  signedIn: boolean;
  /** The sign-in provider's id for the person (what the backend calls user_id). */
  userId: string | null;
  name: string;
  email: string | null;
  /** Roles from the backend, the same ones it enforces. Empty until loaded. */
  roles: string[];
  loading: boolean;
  failed: boolean;
};

/** Who is using the Hub and what they may do. One request, shared by every component that asks. */
export function useSession(): Session {
  const user = useUser();
  const roles = useQuery({
    queryKey: ["session", "roles", user?.id],
    enabled: !!user,
    staleTime: 120_000,
    queryFn: async () => (await api.get<{ roles: string[] }>("/roles/my-roles")).roles,
    meta: { silent: true }, // the shell shows its own "could not check your access"
  });
  return {
    signedIn: !!user,
    userId: user?.id ?? null,
    name: user?.displayName || user?.primaryEmail || "Account",
    email: user?.primaryEmail ?? null,
    roles: roles.data ?? [],
    loading: !!user && roles.isPending,
    failed: roles.isError,
  };
}
