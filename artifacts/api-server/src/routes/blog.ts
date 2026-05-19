import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, blogPostsTable } from "@workspace/db";
import { CreateBlogBody, UpdateBlogBody } from "@workspace/api-zod";
import { requireAdmin, optionalAuth } from "../lib/auth";

const router: IRouter = Router();

function parseId(raw: string | string[] | undefined): number | null {
  if (!raw) return null;
  const s = Array.isArray(raw) ? raw[0]! : raw;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? null : n;
}

router.get("/blog", async (req, res): Promise<void> => {
  const published = req.query["published"];
  let rows;
  if (published === "true") {
    rows = await db.select().from(blogPostsTable).where(eq(blogPostsTable.published, true)).orderBy(desc(blogPostsTable.publishedAt));
  } else if (published === "false") {
    rows = await db.select().from(blogPostsTable).where(eq(blogPostsTable.published, false)).orderBy(desc(blogPostsTable.updatedAt));
  } else {
    rows = await db.select().from(blogPostsTable).orderBy(desc(blogPostsTable.publishedAt), desc(blogPostsTable.createdAt));
  }
  res.json(rows);
});

router.post("/blog", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateBlogBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.insert(blogPostsTable).values(parsed.data).returning();
  res.status(201).json(row);
});

router.get("/blog/:slug", optionalAuth, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0]! : req.params.slug;
  const [row] = await db.select().from(blogPostsTable).where(eq(blogPostsTable.slug, slug));
  const isAdmin = req.localUser?.role === "admin";
  if (!row || (!isAdmin && !row.published)) {
    res.status(404).json({ error: "Blog post not found" });
    return;
  }
  res.json(row);
});

router.patch("/blog/id/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateBlogBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.update(blogPostsTable).set(parsed.data).where(eq(blogPostsTable.id, id)).returning();
  if (!row) {
    res.status(404).json({ error: "Blog post not found" });
    return;
  }
  res.json(row);
});

router.delete("/blog/id/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(blogPostsTable).where(eq(blogPostsTable.id, id));
  res.sendStatus(204);
});

export default router;
