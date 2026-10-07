import { useRouteError } from 'react-router-dom';

export default function PageRecovery() {
  const error = useRouteError();
  const message = error instanceof Error ? error.message : '';
  const failedModule = /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk.*failed/i.test(message);
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <section role="alert" className="w-full max-w-xl rounded-lg border bg-card p-6 text-card-foreground">
        <h1 className="text-2xl font-semibold">{failedModule ? 'This page could not be downloaded' : 'This page could not be displayed'}</h1>
        <p className="mt-3">{failedModule
          ? 'Citizen Hub could not download the JavaScript file for this page. Your open tab may refer to a previous release, or the connection may have failed. Retry reloads the current version.'
          : 'An application error interrupted this page. Retry reloads it; if the problem continues, return to Citizen Hub and contact support.'}</p>
        <p className="mt-2 text-sm text-muted-foreground">Reloading may discard unsaved entries on this page.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground" onClick={() => window.location.reload()}>Retry</button>
          <button className="rounded-md border px-4 py-2" onClick={() => window.history.back()}>Go back</button>
          <a className="rounded-md border px-4 py-2" href="/">Cancel to Citizen Hub</a>
        </div>
      </section>
    </main>
  );
}
