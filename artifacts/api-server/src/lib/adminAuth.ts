import type { Request, Response, NextFunction } from "express";
import { eq, and, gt } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import {
  db,
  adminUsersTable,
  adminSessionsTable,
  adminActivitiesTable,
  type AdminUser,
} from "@workspace/db";
import { logger } from "./logger";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      adminUser?: AdminUser;
    }
  }
}

export const ADMIN_SESSION_COOKIE = "aivec_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

export function generateSessionToken(): string {
  return randomBytes(48).toString("hex");
}

export async function createSession(adminUserId: number): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(adminSessionsTable).values({ token, adminUserId, expiresAt });
  return token;
}

export async function destroySession(token: string): Promise<void> {
  await db.delete(adminSessionsTable).where(eq(adminSessionsTable.token, token));
}

export async function getAdminBySessionToken(token: string): Promise<AdminUser | null> {
  const rows = await db
    .select({ admin: adminUsersTable })
    .from(adminSessionsTable)
    .innerJoin(adminUsersTable, eq(adminSessionsTable.adminUserId, adminUsersTable.id))
    .where(
      and(
        eq(adminSessionsTable.token, token),
        gt(adminSessionsTable.expiresAt, new Date()),
      ),
    )
    .limit(1);
  const admin = rows[0]?.admin;
  if (!admin || !admin.active) return null;
  return admin;
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env["NODE_ENV"] === "production",
    path: "/",
    maxAge: SESSION_TTL_MS,
  };
}

export function getAdminSessionToken(req: Request): string {
  const cookieToken = (req.cookies?.[ADMIN_SESSION_COOKIE] as string | undefined) ?? "";
  if (cookieToken) return cookieToken;

  const authorization = req.header("authorization") ?? "";
  const bearerMatch = authorization.match(/^Bearer\s+(.+)$/i);
  if (bearerMatch?.[1]) return bearerMatch[1].trim();

  return req.header("x-admin-session-token")?.trim() ?? "";
}

export async function requireAdminSession(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = getAdminSessionToken(req);
  if (!token) {
    res.status(401).json({ error: "Admin session required" });
    return;
  }
  const admin = await getAdminBySessionToken(token);
  if (!admin) {
    res.status(401).json({ error: "Admin session expired or invalid" });
    return;
  }
  req.adminUser = admin;
  next();
}

export async function optionalAdminSession(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = getAdminSessionToken(req);
  if (token) {
    const admin = await getAdminBySessionToken(token);
    if (admin) req.adminUser = admin;
  }
  next();
}

export async function countActiveAdmins(): Promise<number> {
  const rows = await db
    .select({ id: adminUsersTable.id })
    .from(adminUsersTable)
    .where(eq(adminUsersTable.active, true));
  return rows.length;
}

export async function logAdminActivity(
  req: Request,
  action: string,
  opts: {
    targetType?: string;
    targetId?: string | number;
    summary?: string;
    details?: unknown;
  } = {},
): Promise<void> {
  const admin = req.adminUser;
  if (!admin) return;
  try {
    await db.insert(adminActivitiesTable).values({
      adminUserId: admin.id,
      adminUsername: admin.username,
      action,
      targetType: opts.targetType ?? null,
      targetId: opts.targetId !== undefined ? String(opts.targetId) : null,
      summary: opts.summary ?? null,
      details: (opts.details as object | null | undefined) ?? null,
    });
  } catch (err) {
    logger.warn({ err, action }, "Failed to log admin activity");
  }
}

export async function ensureSeedAdmin(): Promise<void> {
  const existing = await db.select({ id: adminUsersTable.id }).from(adminUsersTable).limit(1);
  if (existing.length > 0) return;

  const envUsername = process.env["ADMIN_INITIAL_USERNAME"]?.trim() ?? "";
  const envPassword = process.env["ADMIN_INITIAL_PASSWORD"]?.trim() ?? "";
  const isProd = process.env["NODE_ENV"] === "production";

  if (isProd) {
    if (!envUsername || envPassword.length < 12) {
      logger.error(
        "No admin accounts exist and ADMIN_INITIAL_USERNAME / ADMIN_INITIAL_PASSWORD (>=12 chars) are not set. Refusing to seed a default admin in production.",
      );
      return;
    }
  }

  const username = envUsername || "admin";
  const password = envPassword || "admin";
  const passwordHash = await hashPassword(password);
  await db.insert(adminUsersTable).values({
    username,
    passwordHash,
    displayName: "Administrator",
  });
  logger.info(
    { username },
    "Seeded initial admin user. Please log in and change the password immediately.",
  );
}
