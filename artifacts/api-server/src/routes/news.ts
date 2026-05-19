import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, newsPostsTable } from "@workspace/db";
import { CreateNewsBody, UpdateNewsBody } from "@workspace/api-zod";
import { requireAdminSession, optionalAdminSession, logAdminActivity } from "../lib/adminAuth";

const router: IRouter = Router();

function parseId(raw: string | string[] | undefined): number | null {
  if (!raw) return null;
  const s = Array.isArray(raw) ? raw[0]! : raw;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? null : n;
}

router.get("/news", optionalAdminSession, async (req, res): Promise<void> => {
  const published = req.query["published"];
  const isAdmin = !!req.adminUser;
  let rows;
  if (!isAdmin) {
    rows = await db.select().from(newsPostsTable).where(eq(newsPostsTable.published, true)).orderBy(desc(newsPostsTable.publishedAt));
  } else if (published === "true") {
    rows = await db.select().from(newsPostsTable).where(eq(newsPostsTable.published, true)).orderBy(desc(newsPostsTable.publishedAt));
  } else if (published === "false") {
    rows = await db.select().from(newsPostsTable).where(eq(newsPostsTable.published, false)).orderBy(desc(newsPostsTable.updatedAt));
  } else {
    rows = await db.select().from(newsPostsTable).orderBy(desc(newsPostsTable.publishedAt), desc(newsPostsTable.createdAt));
  }
  res.json(rows);
});

router.post("/news", requireAdminSession, async (req, res): Promise<void> => {
  const parsed = CreateNewsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.insert(newsPostsTable).values(parsed.data).returning();
  await logAdminActivity(req, "news.create", {
    targetType: "news",
    targetId: row!.id,
    summary: `Created news post "${row!.titleEn}"`,
  });
  res.status(201).json(row);
});

router.get("/news/:slug", optionalAdminSession, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0]! : req.params.slug;
  const [row] = await db.select().from(newsPostsTable).where(eq(newsPostsTable.slug, slug));
  const isAdmin = !!req.adminUser;
  if (!row || (!isAdmin && !row.published)) {
    res.status(404).json({ error: "News post not found" });
    return;
  }
  res.json(row);
});

router.patch("/news/id/:id", requireAdminSession, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateNewsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.update(newsPostsTable).set(parsed.data).where(eq(newsPostsTable.id, id)).returning();
  if (!row) {
    res.status(404).json({ error: "News post not found" });
    return;
  }
  await logAdminActivity(req, "news.update", {
    targetType: "news",
    targetId: row.id,
    summary: `Updated news post "${row.titleEn}"`,
  });
  res.json(row);
});

router.delete("/news/id/:id", requireAdminSession, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [existing] = await db.select().from(newsPostsTable).where(eq(newsPostsTable.id, id));
  await db.delete(newsPostsTable).where(eq(newsPostsTable.id, id));
  await logAdminActivity(req, "news.delete", {
    targetType: "news",
    targetId: id,
    summary: existing ? `Deleted news post "${existing.titleEn}"` : `Deleted news post #${id}`,
  });
  res.sendStatus(204);
});

export default router;
