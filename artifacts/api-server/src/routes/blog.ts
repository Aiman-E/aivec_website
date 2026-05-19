import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, blogPostsTable } from "@workspace/db";
import { CreateBlogBody, UpdateBlogBody } from "@workspace/api-zod";
import { requireAdminSession, optionalAdminSession, logAdminActivity } from "../lib/adminAuth";

const router: IRouter = Router();

function parseId(raw: string | string[] | undefined): number | null {
  if (!raw) return null;
  const s = Array.isArray(raw) ? raw[0]! : raw;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? null : n;
}

router.get("/blog", optionalAdminSession, async (req, res): Promise<void> => {
  const published = req.query["published"];
  const isAdmin = !!req.adminUser;
  let rows;
  if (!isAdmin) {
    rows = await db.select().from(blogPostsTable).where(eq(blogPostsTable.published, true)).orderBy(desc(blogPostsTable.publishedAt));
  } else if (published === "true") {
    rows = await db.select().from(blogPostsTable).where(eq(blogPostsTable.published, true)).orderBy(desc(blogPostsTable.publishedAt));
  } else if (published === "false") {
    rows = await db.select().from(blogPostsTable).where(eq(blogPostsTable.published, false)).orderBy(desc(blogPostsTable.updatedAt));
  } else {
    rows = await db.select().from(blogPostsTable).orderBy(desc(blogPostsTable.publishedAt), desc(blogPostsTable.createdAt));
  }
  res.json(rows);
});

router.post("/blog", requireAdminSession, async (req, res): Promise<void> => {
  const parsed = CreateBlogBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.insert(blogPostsTable).values(parsed.data).returning();
  await logAdminActivity(req, "blog.create", {
    targetType: "blog",
    targetId: row!.id,
    summary: `Created blog post "${row!.titleEn}"`,
  });
  res.status(201).json(row);
});

router.get("/blog/:slug", optionalAdminSession, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0]! : req.params.slug;
  const [row] = await db.select().from(blogPostsTable).where(eq(blogPostsTable.slug, slug));
  const isAdmin = !!req.adminUser;
  if (!row || (!isAdmin && !row.published)) {
    res.status(404).json({ error: "Blog post not found" });
    return;
  }
  res.json(row);
});

router.patch("/blog/id/:id", requireAdminSession, async (req, res): Promise<void> => {
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
  await logAdminActivity(req, "blog.update", {
    targetType: "blog",
    targetId: row.id,
    summary: `Updated blog post "${row.titleEn}"`,
  });
  res.json(row);
});

router.delete("/blog/id/:id", requireAdminSession, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [existing] = await db.select().from(blogPostsTable).where(eq(blogPostsTable.id, id));
  await db.delete(blogPostsTable).where(eq(blogPostsTable.id, id));
  await logAdminActivity(req, "blog.delete", {
    targetType: "blog",
    targetId: id,
    summary: existing ? `Deleted blog post "${existing.titleEn}"` : `Deleted blog post #${id}`,
  });
  res.sendStatus(204);
});

export default router;
