import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import pinoHttp from "pino-http";
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

// Trust the first managed reverse proxy hop (Dokploy/Traefik) so req.hostname
// and req.secure reflect the public-facing host/scheme. Do NOT use `true` here;
// that would
// trust X-Forwarded-* from any upstream and enable IP/host spoofing for
// downstream consumers (e.g. the rate limiter in routes/storage.ts).
app.set("trust proxy", 1);

const normalizeOrigin = (d: string): string => {
  const trimmed = d.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
};

const envAllowedOrigins = new Set(
  (process.env["ALLOWED_ORIGINS"] ?? "")
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean),
);

const envAllowedHosts = new Set(
  [...envAllowedOrigins].map((o) => {
    try { return new URL(o).host; } catch { return ""; }
  }).filter(Boolean),
);

// Per-request CORS check. Same-origin requests are always allowed: we trust
// req.hostname (derived from X-Forwarded-Host through one proxy hop) and
// compare its host to the Origin's host. We never mutate shared state, so a
// request with a spoofed Host header cannot poison the allowlist for other
// requests.
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
        // req.hostname, so an Origin matching that host is safe.
        if (originHost === req.hostname) return cb(null, true);
      } catch { /* fall through */ }
      cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
  })(req, res, next);
});
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api", router);

app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const status = getHttpErrorStatus(err);
  logger.error({ err, status }, "Unhandled API error");
  res.status(status).json({
    error: status >= 500 ? "Internal server error" : getHttpErrorMessage(err),
  });
});

export default app;

function getHttpErrorStatus(err: unknown): number {
  if (!err || typeof err !== "object") return 500;
  const status = "status" in err ? Number(err.status) : NaN;
  const statusCode = "statusCode" in err ? Number(err.statusCode) : NaN;
  const candidate = Number.isInteger(status) ? status : statusCode;
  return candidate >= 400 && candidate <= 599 ? candidate : 500;
}

function getHttpErrorMessage(err: unknown): string {
  if (!err || typeof err !== "object") return "Invalid request";
  if ("type" in err && err.type === "entity.too.large") return "Payload too large";
  if ("message" in err && typeof err.message === "string" && err.message.trim()) {
    return err.message;
  }
  return "Invalid request";
}
