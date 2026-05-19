import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, siteSettingsTable, formsTable } from "@workspace/db";
import { UpdateSiteSettingsBody } from "@workspace/api-zod";
import { requireAdminSession, logAdminActivity } from "../lib/adminAuth";

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

router.patch("/site-settings", requireAdminSession, async (req, res): Promise<void> => {
  const parsed = UpdateSiteSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const current = await ensureSettings();
  if (
    "heroCtaFormSlug" in parsed.data &&
    parsed.data.heroCtaFormSlug != null &&
    parsed.data.heroCtaFormSlug.trim() !== ""
  ) {
    const slug = parsed.data.heroCtaFormSlug.trim();
    const [form] = await db
      .select({ status: formsTable.status })
      .from(formsTable)
      .where(eq(formsTable.slug, slug))
      .limit(1);
    if (!form) {
      res.status(400).json({ error: `Form with slug "${slug}" does not exist` });
      return;
    }
    if (form.status !== "open") {
      res.status(400).json({ error: `Form "${slug}" is not open for submissions` });
      return;
    }
    parsed.data.heroCtaFormSlug = slug;
  }
  const [updated] = await db
    .update(siteSettingsTable)
    .set(parsed.data)
    .where(eq(siteSettingsTable.id, current.id))
    .returning();
  await logAdminActivity(req, "site_settings.update", {
    targetType: "site_settings",
    summary: "Updated site settings",
    details: { fields: Object.keys(parsed.data) },
  });
  res.json(updated);
});

export default router;
