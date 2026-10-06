import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { websiteUrl } from "./config";
import { FROM_HUB_PARAM } from "./signin";

/**
 * Any address the Hub does not own goes to the same address on the website, so every link in the shared screens
 * keeps working. (The website sends the screens that now live here the other way, so the two never bounce.)
 */
export default function ExternalRedirect() {
  const { pathname, search, hash } = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(search);
    params.set(FROM_HUB_PARAM, "1");
    window.location.replace(websiteUrl(`${pathname}?${params.toString()}${hash}`));
  }, [pathname, search, hash]);
  return (
    <main className="flex min-h-screen items-center justify-center text-muted-foreground">
      <p>Taking you to Citizen Bank…</p>
    </main>
  );
}
