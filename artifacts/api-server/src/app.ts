import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

// Trust Replit's managed edge proxy (single hop) so req.hostname and req.secure
// reflect the public-facing host/scheme. Do NOT use `true` here — that would
// trust X-Forwarded-* from any upstream and enable IP/host spoofing for
// downstream consumers (e.g. the rate limiter in routes/storage.ts).
app.set("trust proxy", 1);

const normalizeOrigin = (d: string): string => {
  const trimmed = d.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
};

const envAllowedOrigins = new Set(
  [
    ...(process.env["REPLIT_DOMAINS"] ?? "").split(","),
    ...(process.env["ALLOWED_ORIGINS"] ?? "").split(","),
  ]
    .map(normalizeOrigin)
    .filter(Boolean),
);

const envAllowedHosts = new Set(
  [...envAllowedOrigins].map((o) => {
    try { return new URL(o).host; } catch { return ""; }
  }).filter(Boolean),
);

// Per-request CORS check. Same-origin requests are always allowed: we trust
// req.hostname (derived from X-Forwarded-Host through one proxy hop, which is
// Replit's edge) and compare its host to the Origin's host. We never mutate
// shared state, so a request with a spoofed Host header cannot poison the
// allowlist for other requests.
app.use((req, res, next) => {
  cors({
    credentials: true,
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (process.env["NODE_ENV"] !== "production") return cb(null, true);
      if (envAllowedOrigins.has(origin)) return cb(null, true);
      try {
        const originHost = new URL(origin).host;
        if (envAllowedHosts.has(originHost)) return cb(null, true);
        // Same-origin: the page that issued this request was served from
        // req.hostname, so an Origin matching that host is by definition
        // same-origin and safe (no other site can forge this combination
        // through a browser).
        if (originHost === req.hostname) return cb(null, true);
      } catch { /* fall through */ }
      cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
  })(req, res, next);
});
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env["CLERK_PUBLISHABLE_KEY"],
    ),
  })),
);

app.use("/api", router);

export default app;
