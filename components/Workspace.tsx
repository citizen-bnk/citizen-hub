import { redirect } from "next/navigation";
import { can, modules, type Person } from "@/lib/contracts";
import { currentPerson } from "@/lib/session";
import { ServiceIssue } from "@/lib/db";
import { WorkspaceShell } from "./WorkspaceShell";
import { Recovery } from "./Recovery";

/**
 * Wraps a signed-in page: sends signed-out visitors to sign in, refuses roles the module is not for,
 * and turns a failing data service into a recovery screen instead of a crash.
 */
export async function Workspace({ module, path, children }: { module: string; path: string; children: (person: Person) => Promise<React.ReactNode> }) {
  let person: Person | null;
  try { person = await currentPerson(); } catch (error) {
    if (error instanceof ServiceIssue) return <Recovery message={error.message} code={error.code} />;
    throw error;
  }
  if (!person) redirect(`/login?next=${encodeURIComponent(path)}`);
  const item = modules.find((entry) => entry.id === module);
  if (!item || !can(person.roles, item.roles)) {
    return <WorkspaceShell person={person} active={module}><Recovery title="This workspace is not available to your account" message="Your current Citizen roles do not permit this area. Go back or open a permitted workspace." code="WORKSPACE_ACCESS_DENIED" /></WorkspaceShell>;
  }
  try {
    return <WorkspaceShell person={person} active={module}>{await children(person)}</WorkspaceShell>;
  } catch (error) {
    if (error instanceof ServiceIssue) return <WorkspaceShell person={person} active={module}><Recovery title="This information is temporarily unavailable" message={error.message} code={error.code} /></WorkspaceShell>;
    throw error;
  }
}
