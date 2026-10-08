import { QueryClientProvider } from "@tanstack/react-query";
import { StackProvider } from "@stackframe/react";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { stackClientApp } from "./platform/auth/stack";
import { createQueryClient, setSignedOutHandler } from "./platform/api/query";
import { ThemeProvider } from "./platform/ui/ThemeProvider";
import { router } from "./platform/router";
import { ApplicationRecovery, SessionBoundary } from "./platform/ui/ApplicationBoundary";

/** The whole app: sign-in, the shared data client (which reports every failure once), theme, toasts and the router. */
export function App() {
  const client = useMemo(() => {
    setSignedOutHandler(() => window.location.assign("/auth/sign-in"));
    return createQueryClient();
  }, []);
  return (
    <ErrorBoundary fallbackRender={({ error }) => <ApplicationRecovery error={error} />}>
      <SessionBoundary>
      <StackProvider app={stackClientApp}>
        <ThemeProvider defaultTheme="dark">
          <QueryClientProvider client={client}>
            {/* Lazy feature screens suspend during navigation. React Router's transition mode keeps that
                suspension out of synchronous input updates (React 18 error 426). */}
            <RouterProvider router={router} future={{ v7_startTransition: true }} />
            <Toaster richColors closeButton position="top-right" />
          </QueryClientProvider>
        </ThemeProvider>
      </StackProvider>
      </SessionBoundary>
    </ErrorBoundary>
  );
}
