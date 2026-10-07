import react from "@vitejs/plugin-react";
import "dotenv/config";
import path from "node:path";
import { defineConfig, loadEnv } from "vite";

// The sign-in project is the same Stack Auth project as the website's, so one account works on both.
// AUTH_PROVIDERS holds the same JSON the website uses; VITE_STACK_* are the plain alternative. There is no default project.
type Extension = { name: string; config: Record<string, unknown> };

const stub = process.env.HUB_E2E_STUB === "1"; // swaps the sign-in library for a stand-in so screens can be rendered without an account

function stackConfig(): Record<string, unknown> {
  const env = { ...loadEnv("production", process.cwd(), ""), ...process.env };
  const list = JSON.parse(env.AUTH_PROVIDERS || "[]") as Extension[];
  const configured = list.find((e) => e.name === "stack-auth")?.config ?? {};
  const projectId = configured.projectId || env.VITE_STACK_PROJECT_ID;
  const publishableClientKey = configured.publishableClientKey || env.VITE_STACK_PUBLISHABLE_CLIENT_KEY;
  if (!stub && (!projectId || !publishableClientKey)) {
    throw new Error("Configure AUTH_PROVIDERS or VITE_STACK_PROJECT_ID and VITE_STACK_PUBLISHABLE_CLIENT_KEY before building the Hub");
  }
  return { projectId, publishableClientKey, handlerUrl: configured.handlerUrl || "auth", jwksUrl: configured.jwksUrl || "" };
}

export default defineConfig({
  define: {
    __APP_ID__: JSON.stringify("citizenhub-hub"),
    __STACK_AUTH_CONFIG__: JSON.stringify(stackConfig()),
  },
  plugins: [react()],
  server: { proxy: { "/api": { target: process.env.DEV_API_TARGET ?? "http://127.0.0.1:8000", changeOrigin: true } } },
  resolve: {
    alias: {
      ...(stub ? { "@stackframe/react": path.resolve(__dirname, "./tests/support/stack-stub.tsx") } : {}),
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: { chunkSizeWarningLimit: 700 },
});
