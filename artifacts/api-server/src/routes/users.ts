import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { UpdateUserRoleBody } from "@workspace/api-zod";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

router.get("/users", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db.select().from(usersTable).orderBy(asc(usersTable.createdAt));
  res.json(rows);
});

router.patch("/users/:id/role", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id;
  const id = parseInt(raw, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateUserRoleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.update(usersTable).set({ role: parsed.data.role }).where(eq(usersTable.id, id)).returning();
  if (!row) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(row);
});

export default router;
