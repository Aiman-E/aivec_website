import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, adminUsersTable } from "@workspace/db";
import {
  requireAdminSession,
  hashPassword,
  logAdminActivity,
  countActiveAdmins,
} from "../lib/adminAuth";

const router: IRouter = Router();

router.get("/admin/accounts", requireAdminSession, async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: adminUsersTable.id,
      username: adminUsersTable.username,
      displayName: adminUsersTable.displayName,
      active: adminUsersTable.active,
      lastLoginAt: adminUsersTable.lastLoginAt,
      createdAt: adminUsersTable.createdAt,
    })
    .from(adminUsersTable)
    .orderBy(desc(adminUsersTable.createdAt));
  res.json(rows);
});

router.post("/admin/accounts", requireAdminSession, async (req, res): Promise<void> => {
  const body = (req.body ?? {}) as {
    username?: unknown;
    password?: unknown;
    displayName?: unknown;
  };
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const displayName =
    typeof body.displayName === "string" && body.displayName.trim() !== ""
      ? body.displayName.trim()
      : null;
  if (!username || username.length < 3) {
    res.status(400).json({ error: "Username must be at least 3 characters" });
    return;
  }
  if (!password || password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }
  const existing = await db
    .select({ id: adminUsersTable.id })
    .from(adminUsersTable)
    .where(eq(adminUsersTable.username, username))
    .limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }
  const passwordHash = await hashPassword(password);
  const [created] = await db
    .insert(adminUsersTable)
    .values({ username, passwordHash, displayName })
    .returning({
      id: adminUsersTable.id,
      username: adminUsersTable.username,
      displayName: adminUsersTable.displayName,
      active: adminUsersTable.active,
      lastLoginAt: adminUsersTable.lastLoginAt,
      createdAt: adminUsersTable.createdAt,
    });
  await logAdminActivity(req, "admin_account.create", {
    targetType: "admin_account",
    targetId: created!.id,
    summary: `Created admin account "${created!.username}"`,
  });
  res.status(201).json(created);
});

router.patch("/admin/accounts/:id", requireAdminSession, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id ?? ""), 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const body = (req.body ?? {}) as {
    displayName?: unknown;
    password?: unknown;
    active?: unknown;
  };
  const updates: Record<string, unknown> = {};
  if (typeof body.displayName === "string") updates["displayName"] = body.displayName.trim() || null;
  if (typeof body.active === "boolean") {
    if (body.active === false) {
      if (req.adminUser?.id === id) {
        res.status(400).json({ error: "You cannot disable your own account" });
        return;
      }
      const [target] = await db
        .select({ active: adminUsersTable.active })
        .from(adminUsersTable)
        .where(eq(adminUsersTable.id, id))
        .limit(1);
      if (target?.active) {
        const activeCount = await countActiveAdmins();
        if (activeCount <= 1) {
          res.status(400).json({ error: "At least one active admin must remain" });
          return;
        }
      }
    }
    updates["active"] = body.active;
  }
  if (typeof body.password === "string" && body.password.length > 0) {
    if (body.password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }
    updates["passwordHash"] = await hashPassword(body.password);
  }
  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No updates provided" });
    return;
  }
  const [updated] = await db
    .update(adminUsersTable)
    .set(updates)
    .where(eq(adminUsersTable.id, id))
    .returning({
      id: adminUsersTable.id,
      username: adminUsersTable.username,
      displayName: adminUsersTable.displayName,
      active: adminUsersTable.active,
      lastLoginAt: adminUsersTable.lastLoginAt,
      createdAt: adminUsersTable.createdAt,
    });
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await logAdminActivity(req, "admin_account.update", {
    targetType: "admin_account",
    targetId: id,
    summary: `Updated admin account "${updated.username}"`,
    details: { fields: Object.keys(updates) },
  });
  res.json(updated);
});

router.delete("/admin/accounts/:id", requireAdminSession, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id ?? ""), 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  if (req.adminUser?.id === id) {
    res.status(400).json({ error: "You cannot delete your own account" });
    return;
  }
  const [target] = await db
    .select({ username: adminUsersTable.username, active: adminUsersTable.active })
    .from(adminUsersTable)
    .where(eq(adminUsersTable.id, id))
    .limit(1);
  if (!target) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (target.active) {
    const activeCount = await countActiveAdmins();
    if (activeCount <= 1) {
      res.status(400).json({ error: "At least one active admin must remain" });
      return;
    }
  }
  await db.delete(adminUsersTable).where(eq(adminUsersTable.id, id));
  await logAdminActivity(req, "admin_account.delete", {
    targetType: "admin_account",
    targetId: id,
    summary: `Deleted admin account "${target?.username ?? id}"`,
  });
  res.sendStatus(204);
});

export default router;
