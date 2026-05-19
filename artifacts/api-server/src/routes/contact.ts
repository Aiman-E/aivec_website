import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, contactSubmissionsTable } from "@workspace/db";
import { CreateContactSubmissionBody } from "@workspace/api-zod";
import { requireAdminSession, logAdminActivity } from "../lib/adminAuth";

const router: IRouter = Router();

router.get("/contact-submissions", requireAdminSession, async (_req, res): Promise<void> => {
  const rows = await db.select().from(contactSubmissionsTable).orderBy(desc(contactSubmissionsTable.createdAt));
  res.json(rows);
});

router.post("/contact-submissions", async (req, res): Promise<void> => {
  const parsed = CreateContactSubmissionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(contactSubmissionsTable)
    .values({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone ?? "",
      subject: parsed.data.subject ?? "",
      message: parsed.data.message,
    })
    .returning();
  res.status(201).json(row);
});

router.delete("/contact-submissions/:id", requireAdminSession, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id;
  const id = parseInt(raw, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(contactSubmissionsTable).where(eq(contactSubmissionsTable.id, id));
  await logAdminActivity(req, "contact.delete", {
    targetType: "contact",
    targetId: id,
    summary: `Deleted contact message #${id}`,
  });
  res.sendStatus(204);
});

export default router;
