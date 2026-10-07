import react from "@vitejs/plugin-react";
import "dotenv/config";
import path from "node:path";
import { defineConfig, loadEnv, splitVendorChunkPlugin } from "vite";
import injectHTML from "vite-plugin-html-inject";
import tsConfigPaths from "vite-tsconfig-paths";

// The sign-in project is the same Stack Auth project as the website's, so one account works on both.
// AUTH_PROVIDERS holds the same JSON the website uses. There is deliberately no built-in default project.
type Extension = { name: string; version: string; config: Record<string, unknown> };

const stackConfig = (): Record<string, unknown> => {
  const env = { ...loadEnv("production", process.cwd(), ""), ...process.env };
  try {
    const list = JSON.parse(env.AUTH_PROVIDERS || "[]") as Extension[];
    const configured = list.find((e) => e.name === "stack-auth")?.config ?? {};
    const projectId = configured.projectId || env.VITE_STACK_PROJECT_ID;
    const publishableClientKey = configured.publishableClientKey || env.VITE_STACK_PUBLISHABLE_CLIENT_KEY;
    if (process.env.HUB_E2E_STUB !== "1" && (!projectId || !publishableClientKey)) {
      throw new Error("Configure AUTH_PROVIDERS or VITE_STACK_PROJECT_ID and VITE_STACK_PUBLISHABLE_CLIENT_KEY before building the Hub");
    }
    return { projectId, publishableClientKey, handlerUrl: configured.handlerUrl || "auth", jwksUrl: configured.jwksUrl || "" };
  } catch (err) {
    throw new Error("Citizen Hub authentication configuration is missing or invalid", { cause: err });
  }
};

// HUB_E2E_STUB=1 swaps the sign-in library for a stand-in, so screens can be rendered and compared without a real account.
const stub = process.env.HUB_E2E_STUB === "1";

export default defineConfig({
  define: {
    __APP_ID__: JSON.stringify("citizenhub-hub"),
    __API_PATH__: JSON.stringify(process.env.API_PATH),
    __API_HOST__: JSON.stringify(""),
    __API_PREFIX_PATH__: JSON.stringify(""),
    __API_URL__: JSON.stringify("http://localhost:8000"),
    __WS_API_URL__: JSON.stringify("ws://localhost:8000"),
    __APP_TITLE__: JSON.stringify("Citizen Hub"),
    __APP_FAVICON_LIGHT__: JSON.stringify("/favicon.png"),
    __APP_FAVICON_DARK__: JSON.stringify("/favicon.png"),
    __APP_DEPLOY_USERNAME__: JSON.stringify(""),
    __APP_DEPLOY_APPNAME__: JSON.stringify(""),
    __APP_DEPLOY_CUSTOM_DOMAIN__: JSON.stringify(""),
    __APP_BASE_PATH__: JSON.stringify(""),
    __STACK_AUTH_CONFIG__: JSON.stringify(stackConfig()),
    __FIREBASE_CONFIG__: JSON.stringify(undefined),
  },
  plugins: [react(), splitVendorChunkPlugin(), tsConfigPaths(), injectHTML()],
  server: { proxy: { "/api": { target: process.env.DEV_API_TARGET ?? "http://127.0.0.1:8000", changeOrigin: true } } },
  resolve: {
    alias: {
      ...(stub ? { "@stackframe/react": path.resolve(__dirname, "./tests/support/stack-stub.tsx") } : {}),
      "@": path.resolve(__dirname, "./src"),
      "@/components/ui": path.resolve(__dirname, "./src/extensions/shadcn/components"),
      "@/components/hooks": path.resolve(__dirname, "./src/extensions/shadcn/hooks"),
      "@/hooks": path.resolve(__dirname, "./src/extensions/shadcn/hooks"),
      components: path.resolve(__dirname, "./src/components"),
      pages: path.resolve(__dirname, "./src/pages"),
      app: path.resolve(__dirname, "./src/app"),
      utils: path.resolve(__dirname, "./src/utils"),
    },
  },
});
