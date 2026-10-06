import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Landmark, Users } from "lucide-react";
import { Header } from "components/Header";
import { Footer } from "components/Footer";
import { useUserRoles } from "utils/useUserRoles";
import { workspacesFor } from "./workspaces";
import { websiteUrl } from "./config";

/** Landing page. Someone with a single workspace goes straight to it; someone with several chooses. */
export default function HubHome() {
  const { roles, loading } = useUserRoles();
  const navigate = useNavigate();
  const spaces = workspacesFor(roles);
  const internal = spaces.filter((s) => !s.external);

  useEffect(() => {
    if (!loading && spaces.length === 1 && internal.length === 1) navigate(internal[0].path, { replace: true });
  }, [loading, spaces.length, internal, navigate]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <h1 className="text-3xl font-bold">Citizen Hub</h1>
        <p className="mt-2 text-muted-foreground">Your investor and board workspaces.</p>
        {loading ? (
          <p className="mt-8 text-muted-foreground">Loading your workspaces…</p>
        ) : spaces.length === 0 ? (
          <div className="mt-8 rounded-lg border bg-card p-6">
            <p>Your account has no Hub workspace yet.</p>
            <a className="mt-3 inline-flex items-center gap-1 text-primary-light" href={websiteUrl("/")}>
              Back to the Citizen Bank website <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {spaces.map((s) => {
              const Icon = s.kind === "board" ? Users : Landmark;
              const body = (
                <>
                  <Icon className="h-6 w-6 text-primary-light" />
                  <h2 className="mt-3 text-lg font-semibold">{s.label}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                </>
              );
              return s.external ? (
                <a key={s.path} href={websiteUrl(s.path)} className="rounded-lg border bg-card p-5 transition hover:border-primary">{body}</a>
              ) : (
                <Link key={s.path} to={s.path} className="rounded-lg border bg-card p-5 transition hover:border-primary">{body}</Link>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
