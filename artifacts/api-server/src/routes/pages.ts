import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, pagesTable } from "@workspace/db";
import { UpdatePageBody } from "@workspace/api-zod";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

router.get("/pages/:key", async (req, res): Promise<void> => {
  const key = Array.isArray(req.params.key) ? req.params.key[0]! : req.params.key;
  const [page] = await db.select().from(pagesTable).where(eq(pagesTable.key, key));
  if (!page) {
    res.json({
      id: 0,
      key,
      titleEn: "",
      titleAr: "",
      subtitleEn: "",
      subtitleAr: "",
      bodyEn: "",
      bodyAr: "",
      sections: null,
      updatedAt: new Date(),
    });
    return;
  }
  res.json(page);
});

router.put("/pages/:key", requireAdmin, async (req, res): Promise<void> => {
  const key = Array.isArray(req.params.key) ? req.params.key[0]! : req.params.key;
  const parsed = UpdatePageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [existing] = await db.select().from(pagesTable).where(eq(pagesTable.key, key));
  if (existing) {
    const [updated] = await db
      .update(pagesTable)
      .set(parsed.data)
      .where(eq(pagesTable.id, existing.id))
      .returning();
    res.json(updated);
    return;
  }
  const [created] = await db
    .insert(pagesTable)
    .values({ key, ...parsed.data })
    .returning();
  res.json(created);
});

export default router;
