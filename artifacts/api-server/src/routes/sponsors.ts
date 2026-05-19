import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, sponsorsTable } from "@workspace/db";
import { CreateSponsorBody, UpdateSponsorBody } from "@workspace/api-zod";
import { requireAdminSession, logAdminActivity } from "../lib/adminAuth";

const router: IRouter = Router();

router.get("/sponsors", async (_req, res): Promise<void> => {
  const rows = await db.select().from(sponsorsTable).orderBy(asc(sponsorsTable.order), asc(sponsorsTable.id));
  res.json(rows);
});

router.post("/sponsors", requireAdminSession, async (req, res): Promise<void> => {
  const parsed = CreateSponsorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.insert(sponsorsTable).values(parsed.data).returning();
  await logAdminActivity(req, "sponsor.create", {
    targetType: "sponsor",
    targetId: row!.id,
    summary: `Added sponsor "${row!.nameEn}"`,
  });
  res.status(201).json(row);
});

router.patch("/sponsors/:id", requireAdminSession, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id;
  const id = parseInt(raw, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateSponsorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.update(sponsorsTable).set(parsed.data).where(eq(sponsorsTable.id, id)).returning();
  if (!row) {
    res.status(404).json({ error: "Sponsor not found" });
    return;
  }
  await logAdminActivity(req, "sponsor.update", {
    targetType: "sponsor",
    targetId: row.id,
    summary: `Updated sponsor "${row.nameEn}"`,
  });
  res.json(row);
});

router.delete("/sponsors/:id", requireAdminSession, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id;
  const id = parseInt(raw, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [existing] = await db.select().from(sponsorsTable).where(eq(sponsorsTable.id, id));
  await db.delete(sponsorsTable).where(eq(sponsorsTable.id, id));
  await logAdminActivity(req, "sponsor.delete", {
    targetType: "sponsor",
    targetId: id,
    summary: existing ? `Removed sponsor "${existing.nameEn}"` : `Removed sponsor #${id}`,
  });
  res.sendStatus(204);
});

export default router;
