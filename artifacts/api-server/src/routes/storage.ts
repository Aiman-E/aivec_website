import { Router, type IRouter, type Request, type Response } from "express";
import { Readable } from "stream";
import {
  RequestUploadUrlBody,
  RequestUploadUrlResponse,
} from "@workspace/api-zod";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";
import { requireAdminSession } from "../lib/adminAuth";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

/**
 * POST /storage/uploads/request-url
 *
 * Request a presigned URL for file upload.
 * The client sends JSON metadata (name, size, contentType) — NOT the file.
 * Then uploads the file directly to the returned presigned URL.
 */
router.post("/storage/uploads/request-url", requireAdminSession, async (req: Request, res: Response) => {
  const parsed = RequestUploadUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing or invalid required fields" });
    return;
  }

  try {
    const { name, size, contentType } = parsed.data;

    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
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
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
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

/**
 * GET /storage/public-objects/*
 *
 * Serve public assets from PUBLIC_OBJECT_SEARCH_PATHS.
 * These are unconditionally public — no authentication or ACL checks.
 * IMPORTANT: Always provide this endpoint when object storage is set up.
 */
router.get("/storage/public-objects/*filePath", async (req: Request, res: Response) => {
  try {
    const raw = req.params.filePath;
    const filePath = Array.isArray(raw) ? raw.join("/") : raw;
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
 * Serve object entities from PRIVATE_OBJECT_DIR.
 * These are served from a separate path from /public-objects and can optionally
 * be protected with authentication or ACL checks based on the use case.
 */
router.get("/storage/objects/*path", async (req: Request, res: Response) => {
  try {
    const raw = req.params.path;
    const wildcardPath = Array.isArray(raw) ? raw.join("/") : raw;
    const objectPath = `/objects/${wildcardPath}`;
    const objectFile = await objectStorageService.getObjectEntityFile(objectPath);

    // --- Protected route example (uncomment when using replit-auth) ---
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
