import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, heroImagesTable } from "@workspace/db";
import { CreateHeroImageBody, UpdateHeroImageBody } from "@workspace/api-zod";
import { requireAdminSession, logAdminActivity } from "../lib/adminAuth";

const router: IRouter = Router();

router.get("/hero-images", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(heroImagesTable)
    .orderBy(asc(heroImagesTable.order), asc(heroImagesTable.id));
  res.json(rows);
});

router.post("/hero-images", requireAdminSession, async (req, res): Promise<void> => {
  const parsed = CreateHeroImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.insert(heroImagesTable).values(parsed.data).returning();
  await logAdminActivity(req, "hero_image.create", {
    targetType: "hero_image",
    targetId: row!.id,
    summary: `Added hero image #${row!.id}`,
  });
  res.status(201).json(row);
});

router.patch("/hero-images/:id", requireAdminSession, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id;
  const id = parseInt(raw, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateHeroImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .update(heroImagesTable)
    .set(parsed.data)
    .where(eq(heroImagesTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Hero image not found" });
    return;
  }
  await logAdminActivity(req, "hero_image.update", {
    targetType: "hero_image",
    targetId: row.id,
    summary: `Updated hero image #${row.id}`,
  });
  res.json(row);
});

router.delete("/hero-images/:id", requireAdminSession, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id;
  const id = parseInt(raw, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(heroImagesTable).where(eq(heroImagesTable.id, id));
  await logAdminActivity(req, "hero_image.delete", {
    targetType: "hero_image",
    targetId: id,
    summary: `Removed hero image #${id}`,
  });
  res.sendStatus(204);
});

export default router;
