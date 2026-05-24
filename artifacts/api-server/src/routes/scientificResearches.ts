import { Router, type IRouter, type Request, type Response } from "express";
import { eq, desc } from "drizzle-orm";
import { db, scientificResearchesTable } from "@workspace/db";
import { CreateScientificResearchBody } from "@workspace/api-zod";
import { requireAdminSession, logAdminActivity } from "../lib/adminAuth";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

const SUBMIT_RL_WINDOW_MS = 60_000;
const SUBMIT_RL_MAX = 5;
const submitHits = new Map<string, number[]>();

function checkSubmitRate(key: string): boolean {
  const now = Date.now();
  const cutoff = now - SUBMIT_RL_WINDOW_MS;
  const arr = (submitHits.get(key) ?? []).filter((t) => t > cutoff);
  if (arr.length >= SUBMIT_RL_MAX) {
    submitHits.set(key, arr);
    return false;
  }
  arr.push(now);
  submitHits.set(key, arr);
  return true;
}

function parseId(raw: string | string[] | undefined): number | null {
  if (!raw) return null;
  const s = Array.isArray(raw) ? raw[0]! : raw;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? null : n;
}

router.get("/scientific-researches", requireAdminSession, async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(scientificResearchesTable)
    .orderBy(desc(scientificResearchesTable.createdAt));
  res.json(rows);
});

// Requires a verified Clerk session. Uploader identity (email + clerk id) is taken
// from the verified session, never trusted from the body, so callers cannot spoof
// other users. Uploader display name + paper details come from the body.
router.post("/scientific-researches", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = req.localUser!;
  const rateKey = `clerk:${user.clerkId}`;
  if (!checkSubmitRate(rateKey)) {
    res.status(429).json({ error: "Too many submissions. Please try again shortly." });
    return;
  }
  const parsed = CreateScientificResearchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  // Only accept uploaded object-storage paths, never arbitrary URLs.
  if (!parsed.data.fileUrl.startsWith("/objects/")) {
    res.status(400).json({ error: "Invalid file path" });
    return;
  }
  const values = {
    ...parsed.data,
    // Override identity fields with server-verified values.
    uploaderEmail: user.email,
    uploaderUserId: user.clerkId,
  };
  const [row] = await db.insert(scientificResearchesTable).values(values).returning();
  res.status(201).json(row);
});

router.delete("/scientific-researches/id/:id", requireAdminSession, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [existing] = await db
    .select()
    .from(scientificResearchesTable)
    .where(eq(scientificResearchesTable.id, id));
  await db.delete(scientificResearchesTable).where(eq(scientificResearchesTable.id, id));
  await logAdminActivity(req, "scientificResearch.delete", {
    targetType: "scientificResearch",
    targetId: id,
    summary: existing
      ? `Deleted research submission "${existing.title}" by ${existing.uploaderName}`
      : `Deleted research submission #${id}`,
  });
  res.sendStatus(204);
});

export default router;
