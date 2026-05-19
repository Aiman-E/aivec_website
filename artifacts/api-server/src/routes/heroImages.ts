import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, heroImagesTable } from "@workspace/db";
import { CreateHeroImageBody, UpdateHeroImageBody } from "@workspace/api-zod";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

router.get("/hero-images", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(heroImagesTable)
    .orderBy(asc(heroImagesTable.order), asc(heroImagesTable.id));
  res.json(rows);
});

router.post("/hero-images", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateHeroImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.insert(heroImagesTable).values(parsed.data).returning();
  res.status(201).json(row);
});

router.patch("/hero-images/:id", requireAdmin, async (req, res): Promise<void> => {
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
  res.json(row);
});

router.delete("/hero-images/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id;
  const id = parseInt(raw, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(heroImagesTable).where(eq(heroImagesTable.id, id));
  res.sendStatus(204);
});

export default router;
