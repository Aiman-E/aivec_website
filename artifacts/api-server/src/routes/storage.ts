import express, {
  Router,
  type IRouter,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { Readable } from "stream";
import {
  RequestUploadUrlBody,
  RequestUploadUrlResponse,
} from "@workspace/api-zod";
import {
  InvalidObjectPathError,
  ObjectStorageService,
  ObjectNotFoundError,
} from "../lib/objectStorage";
import { requireAdminSession } from "../lib/adminAuth";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

/**
 * POST /storage/uploads/request-url
 *
 * Request a local URL for file upload.
 * The client sends JSON metadata (name, size, contentType) — NOT the file.
 * Then uploads the file directly to the returned local upload URL.
 */
router.post("/storage/uploads/request-url", requireAdminSession, async (req: Request, res: Response) => {
  const parsed = RequestUploadUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing or invalid required fields" });
    return;
  }

  try {
    const { name, size, contentType } = parsed.data;

    const uploadURL = await objectStorageService.getObjectEntityUploadURL({
      originalName: name,
      contentType,
      size,
    });
    const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

    res.json(
      RequestUploadUrlResponse.parse({
        uploadURL,
        objectPath,
        metadata: { name, size, contentType },
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Error generating upload URL");
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

/**
 * POST /storage/public/uploads/request-url
 *
 * Public upload endpoint used by public form submissions (image/file fields).
 * No admin auth. Enforces a 10MB size cap and a basic content-type allowlist
 * to limit abuse.
 */
const PUBLIC_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
const PUBLIC_UPLOAD_ALLOWED_PREFIXES = ["image/", "application/pdf"];
const PUBLIC_UPLOAD_ALLOWED_EXACT = new Set([
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

// Simple in-memory sliding-window rate limiter (per IP).
// Limits anonymous upload-URL minting to N requests per window to prevent
// scripted abuse / storage cost DoS. Resets on process restart.
const PUBLIC_UPLOAD_RL_WINDOW_MS = 60_000;
const PUBLIC_UPLOAD_RL_MAX = 20;
const publicUploadHits = new Map<string, number[]>();

function checkPublicUploadRate(ip: string): boolean {
  const now = Date.now();
  const cutoff = now - PUBLIC_UPLOAD_RL_WINDOW_MS;
  const arr = (publicUploadHits.get(ip) ?? []).filter((t) => t > cutoff);
  if (arr.length >= PUBLIC_UPLOAD_RL_MAX) {
    publicUploadHits.set(ip, arr);
    return false;
  }
  arr.push(now);
  publicUploadHits.set(ip, arr);
  // Opportunistic cleanup
  if (publicUploadHits.size > 5000) {
    for (const [k, v] of publicUploadHits) {
      const kept = v.filter((t) => t > cutoff);
      if (kept.length === 0) publicUploadHits.delete(k);
      else publicUploadHits.set(k, kept);
    }
  }
  return true;
}

router.post("/storage/public/uploads/request-url", async (req: Request, res: Response) => {
  const ip = (req.ip || req.socket.remoteAddress || "unknown").toString();
  if (!checkPublicUploadRate(ip)) {
    res.status(429).json({ error: "Too many upload requests. Please try again shortly." });
    return;
  }
  const parsed = RequestUploadUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing or invalid required fields" });
    return;
  }
  const { name, size, contentType } = parsed.data;
  if (typeof size === "number" && size > PUBLIC_UPLOAD_MAX_BYTES) {
    res.status(413).json({ error: "File too large (max 10MB)" });
    return;
  }
  const ct = (contentType || "").toLowerCase();
  const allowed =
    PUBLIC_UPLOAD_ALLOWED_EXACT.has(ct) ||
    PUBLIC_UPLOAD_ALLOWED_PREFIXES.some((p) => ct.startsWith(p));
  if (!allowed) {
    res.status(415).json({ error: "Unsupported file type" });
    return;
  }
  try {
    const uploadURL = await objectStorageService.getObjectEntityUploadURL({
      originalName: name,
      contentType,
      size,
    });
    const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
    res.json(
      RequestUploadUrlResponse.parse({
        uploadURL,
        objectPath,
        metadata: { name, size, contentType },
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Error generating public upload URL");
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

const localUploadBodyParser = express.raw({ type: "*/*", limit: "50mb" });

function parseLocalUploadBody(req: Request, res: Response, next: NextFunction): void {
  localUploadBodyParser(req, res, (err) => {
    if (!err) {
      next();
      return;
    }

    const status = typeof err === "object" && err && "type" in err && err.type === "entity.too.large"
      ? 413
      : 400;
    req.log.warn({ err }, "Rejected local object upload body");
    res.status(status).json({
      error: status === 413 ? "File too large" : "Invalid upload body",
    });
  });
}

/**
 * PUT /storage/local-upload/uploads/:uuid
 *
 * Receives the binary file body for a previously minted local upload URL and
 * writes it under LOCAL_OBJECT_ROOT.
 */
router.put(
  "/storage/local-upload/*path",
  parseLocalUploadBody,
  async (req: Request, res: Response) => {
    try {
      const raw = req.params.path;
      const wildcardPath = Array.isArray(raw) ? raw.join("/") : (raw ?? "");
      const body = Buffer.isBuffer(req.body)
        ? req.body
        : Buffer.from(req.body ?? []);
      const contentType = req.header("content-type") || "application/octet-stream";

      const result = await objectStorageService.saveLocalUpload(wildcardPath, body, {
        contentType,
      });

      req.log.info(
        {
          objectPath: result.objectPath,
          bytes: body.length,
          contentType,
        },
        "Stored local object upload",
      );
      res.json({ ok: true, objectPath: result.objectPath });
    } catch (error) {
      if (error instanceof InvalidObjectPathError) {
        req.log.warn({ err: error }, "Invalid local upload path");
        res.status(400).json({ error: "Invalid upload path" });
        return;
      }
      req.log.error({ err: error }, "Error storing local object upload");
      res.status(500).json({ error: "Failed to store upload" });
    }
  },
);

/**
 * GET /storage/public-objects/*
 *
 * Serve public assets from LOCAL_OBJECT_ROOT.
 * These are unconditionally public — no authentication or ACL checks.
 */
router.get("/storage/public-objects/*filePath", async (req: Request, res: Response) => {
  try {
    const raw = req.params.filePath;
    const filePath = Array.isArray(raw) ? raw.join("/") : (raw ?? "");
    const file = await objectStorageService.searchPublicObject(filePath);
    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const response = await objectStorageService.downloadObject(file);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    req.log.error({ err: error }, "Error serving public object");
    res.status(500).json({ error: "Failed to serve public object" });
  }
});

/**
 * GET /storage/objects/*
 *
 * Serve object entities from LOCAL_OBJECT_ROOT.
 * These are served from a separate path from /public-objects and can optionally
 * be protected with authentication or ACL checks based on the use case.
 */
router.get("/storage/objects/*path", async (req: Request, res: Response) => {
  try {
    const raw = req.params.path;
    const wildcardPath = Array.isArray(raw) ? raw.join("/") : (raw ?? "");
    const objectPath = `/objects/${wildcardPath}`;
    const objectFile = await objectStorageService.getObjectEntityFile(objectPath);

    // --- Protected route example (wire this to native auth before enabling) ---
    // if (!req.isAuthenticated()) {
    //   res.status(401).json({ error: "Unauthorized" });
    //   return;
    // }
    // const canAccess = await objectStorageService.canAccessObjectEntity({
    //   userId: req.user.id,
    //   objectFile,
    //   requestedPermission: ObjectPermission.READ,
    // });
    // if (!canAccess) {
    //   res.status(403).json({ error: "Forbidden" });
    //   return;
    // }

    const response = await objectStorageService.downloadObject(objectFile);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    if (error instanceof InvalidObjectPathError) {
      req.log.warn({ err: error }, "Invalid object path");
      res.status(400).json({ error: "Invalid object path" });
      return;
    }
    if (error instanceof ObjectNotFoundError) {
      req.log.warn({ err: error }, "Object not found");
      res.status(404).json({ error: "Object not found" });
      return;
    }
    req.log.error({ err: error }, "Error serving object");
    res.status(500).json({ error: "Failed to serve object" });
  }
});

export default router;
