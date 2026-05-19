import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, siteSettingsTable } from "@workspace/db";
import { UpdateSiteSettingsBody } from "@workspace/api-zod";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

async function ensureSettings() {
  const [row] = await db.select().from(siteSettingsTable).limit(1);
  if (row) return row;
  const [created] = await db.insert(siteSettingsTable).values({}).returning();
  return created!;
}

router.get("/site-settings", async (_req, res): Promise<void> => {
  const s = await ensureSettings();
  res.json(s);
});

router.patch("/site-settings", requireAdmin, async (req, res): Promise<void> => {
  const parsed = UpdateSiteSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const current = await ensureSettings();
  const [updated] = await db
    .update(siteSettingsTable)
    .set(parsed.data)
    .where(eq(siteSettingsTable.id, current.id))
    .returning();
  res.json(updated);
});

export default router;
