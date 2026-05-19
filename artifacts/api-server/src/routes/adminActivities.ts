import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, adminActivitiesTable } from "@workspace/db";
import { requireAdminSession } from "../lib/adminAuth";

const router: IRouter = Router();

router.get("/admin/activities", requireAdminSession, async (req, res): Promise<void> => {
  const limitRaw = parseInt(String(req.query["limit"] ?? "50"), 10);
  const limit = Math.min(Math.max(Number.isNaN(limitRaw) ? 50 : limitRaw, 1), 200);
  const rows = await db
    .select()
    .from(adminActivitiesTable)
    .orderBy(desc(adminActivitiesTable.createdAt))
    .limit(limit);
  res.json(rows);
});

export default router;
