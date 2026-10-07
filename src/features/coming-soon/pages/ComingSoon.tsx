import { useLocation } from "react-router-dom";

export default function ComingSoon() {
  const { pathname } = useLocation();
  const title = pathname.split("/").filter(Boolean).join(" ").replace(/\b\w/g, (c) => c.toUpperCase()) || "This feature";
  return (
    <section className="mx-auto max-w-3xl rounded-2xl border bg-card p-8 shadow-sm" aria-labelledby="coming-soon-title">
      <p className="text-sm font-medium uppercase tracking-wide text-primary">Planned module</p>
      <h1 id="coming-soon-title" className="mt-2 text-3xl font-semibold">{title}</h1>
      <p className="mt-4 text-muted-foreground">This workspace is part of the Citizen Hub design and is coming soon. It will be enabled after its business workflows, permissions and source-of-truth integrations are completed.</p>
      <a href="/" className="mt-6 inline-flex rounded-lg border px-4 py-2 text-sm hover:bg-accent">Return to Home</a>
    </section>
  );
}
