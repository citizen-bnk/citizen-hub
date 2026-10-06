import { StackHandler, StackProvider, StackTheme } from "@stackframe/react";
import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { authConfigured } from "./config";
import Home from "./Home";
import { stackApp } from "./stack";

function Handler() {
  return <StackHandler app={stackApp} location={useLocation().pathname} fullPage />;
}

function NotConfigured() {
  return (
    <main style={{ maxWidth: 560, margin: "4rem auto", padding: "0 1rem", fontFamily: "system-ui" }}>
      <h1>Citizen Hub</h1>
      <p>Sign-in is not configured for this deployment. Set <code>VITE_STACK_PROJECT_ID</code> and{" "}
        <code>VITE_STACK_PUBLISHABLE_CLIENT_KEY</code> and redeploy.</p>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      {authConfigured ? (
        <StackProvider app={stackApp}>
          <StackTheme>
            <Suspense fallback={<p style={{ fontFamily: "system-ui", margin: "3rem auto", maxWidth: 720 }}>Loading…</p>}>
              <Routes>
                <Route path="/handler/*" element={<Handler />} />
                <Route path="*" element={<Home />} />
              </Routes>
            </Suspense>
          </StackTheme>
        </StackProvider>
      ) : (
        <NotConfigured />
      )}
    </BrowserRouter>
  </React.StrictMode>,
);
