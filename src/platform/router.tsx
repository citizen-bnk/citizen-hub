import { lazy, type ComponentType, useEffect } from "react";
import { createBrowserRouter, Navigate, type RouteObject, useLocation } from "react-router-dom";
import { features } from "../features";
import { allScreens, resolveLegacy, screenRoles } from "./registry";
import { AfterSignIn, AuthPages } from "./auth/pages";
import { RoleGate, SignedIn } from "./auth/Gate";
import DemoSignIn from "./auth/DemoSignIn";
import { Shell } from "./ui/Shell";
import { FROM_HUB_PARAM } from "./auth/signin";
import { websiteUrl } from "./config";

const components = new Map<string, ComponentType>();
const page = (key: string, load: () => Promise<{ default: ComponentType }>) => {
  if (!components.has(key)) components.set(key, lazy(load));
  return components.get(key)!;
};

const screens: RouteObject[] = allScreens(features).map(({ feature, screen }) => {
  const Page = page(`${feature.id}:${screen.path}`, screen.load);
  return {
    path: screen.path,
    element: (
      <RoleGate roles={screenRoles(feature, screen)} title={screen.title}>
        <Page />
      </RoleGate>
    ),
  };
});

/**
 * An address the Hub does not serve. An old website address the Hub took over goes to its new place; anything else is the
 * website's (privacy policy, contact...) and is sent there, marked so the website does not send it straight back.
 */
function Unknown() {
  const { pathname, search, hash } = useLocation();
  const moved = resolveLegacy(features, pathname, search);
  useEffect(() => {
    if (moved) return;
    const params = new URLSearchParams(search);
    params.set(FROM_HUB_PARAM, "1");
    window.location.replace(websiteUrl(`${pathname}?${params}${hash}`));
  }, [moved, pathname, search, hash]);
  if (moved) return <Navigate to={moved} replace />;
  return <main className="flex min-h-screen items-center justify-center text-muted-foreground"><p>Taking you to Citizen Bank…</p></main>;
}

export const router = createBrowserRouter([
  { path: "/demo", element: <DemoSignIn /> },
  { path: "/login", element: <DemoSignIn /> },
  { path: "/auth/redirect", element: <AfterSignIn /> },
  { path: "/auth/*", element: <AuthPages /> },
  { element: <SignedIn><Shell /></SignedIn>, children: screens },
  { path: "*", element: <Unknown /> },
]);
