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

app.set("trust proxy", true);

const normalizeOrigin = (d: string): string => {
  const trimmed = d.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
};

const envAllowedOrigins = [
  ...(process.env["REPLIT_DOMAINS"] ?? "").split(","),
  ...(process.env["ALLOWED_ORIGINS"] ?? "").split(","),
]
  .map(normalizeOrigin)
  .filter(Boolean);

// Mirror the request's own Host into the allowed list BEFORE CORS runs so
// same-origin requests (including from custom domains) are always accepted
// without requiring ALLOWED_ORIGINS to be set explicitly.
app.use((req, _res, next) => {
  const host = req.headers.host;
  if (host) {
    const httpsCandidate = `https://${host}`;
    if (!envAllowedOrigins.includes(httpsCandidate)) envAllowedOrigins.push(httpsCandidate);
    const httpCandidate = `http://${host}`;
    if (!envAllowedOrigins.includes(httpCandidate)) envAllowedOrigins.push(httpCandidate);
  }
  next();
});

app.use(
  cors({
    credentials: true,
    origin: (origin, cb) => {
      // Same-origin / non-browser requests have no Origin header.
      if (!origin) return cb(null, true);
      if (process.env["NODE_ENV"] !== "production") return cb(null, true);
      if (envAllowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
  }),
);
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
