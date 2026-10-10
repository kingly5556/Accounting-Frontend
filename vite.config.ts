import path from "node:path";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import { SignJWT } from "jose";
import { defineConfig } from "vite";

// Production build is served by the Accounting backend (Accounting-Backend/src/app.ts)
// and reached through ERPHUB's proxy at /erp/accounting/..., so asset/API URLs baked into
// the bundle carry that prefix. `import.meta.env.BASE_URL` is what src/lib/api.ts and the
// router's basename read. No auth token handling belongs in app code: ERPHUB's proxy
// attaches the Authorization header on every proxied request.
//
// For local dev WITHOUT ERPHUB in front, nothing attaches that header, so every /api call
// would 401. As a dev-only convenience this config signs a throwaway token with the
// backend's own JWT_SECRET (Accounting-Backend/.env) and has the dev proxy attach it. It
// is never shipped to the production build and never touches app source.
async function devAuthHeader(): Promise<Record<string, string>> {
  const env = dotenv.config({
    path: process.env.BACKEND_ENV_PATH ?? path.resolve(import.meta.dirname, "../Accounting-Backend/.env"),
  }).parsed;
  const secret = env?.JWT_SECRET;
  if (!secret) return {};
  const token = await new SignJWT({
    sub: "dev-user",
    username: "dev",
    roles: ["Admin", "Accountant"],
    allowedModules: ["accounting"],
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(new TextEncoder().encode(secret));
  return { Authorization: `Bearer ${token}` };
}

export default defineConfig(async ({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "/erp/accounting/" : "/",
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "http://localhost:4002",
        headers: command === "serve" ? await devAuthHeader() : undefined,
      },
    },
  },
}));
