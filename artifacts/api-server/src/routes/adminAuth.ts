import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, adminUsersTable } from "@workspace/db";
import {
  ADMIN_SESSION_COOKIE,
  createSession,
  destroySession,
  getAdminSessionToken,
  getSessionCookieOptions,
  requireAdminSession,
  verifyPassword,
  logAdminActivity,
} from "../lib/adminAuth";

const router: IRouter = Router();

router.post("/admin/auth/login", async (req, res): Promise<void> => {
  const body = (req.body ?? {}) as { username?: unknown; password?: unknown };
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }
  const [user] = await db
    .select()
    .from(adminUsersTable)
    .where(eq(adminUsersTable.username, username))
    .limit(1);
  if (!user || !user.active) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }
  const token = await createSession(user.id);
  await db
    .update(adminUsersTable)
    .set({ lastLoginAt: new Date() })
    .where(eq(adminUsersTable.id, user.id));
  res.cookie(ADMIN_SESSION_COOKIE, token, getSessionCookieOptions());
  req.adminUser = user;
  await logAdminActivity(req, "admin.login", {
    summary: `${user.username} signed in`,
  });
  res.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
  });
});

router.post("/admin/auth/logout", async (req, res): Promise<void> => {
  const token = getAdminSessionToken(req);
  if (token) await destroySession(token);
  res.clearCookie(ADMIN_SESSION_COOKIE, { path: "/" });
  res.json({ ok: true });
});

router.get("/admin/auth/me", requireAdminSession, async (req, res): Promise<void> => {
  const u = req.adminUser!;
  res.json({
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    lastLoginAt: u.lastLoginAt,
  });
});

export default router;
