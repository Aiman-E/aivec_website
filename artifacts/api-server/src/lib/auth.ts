import type { Request, Response, NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, usersTable, type User } from "@workspace/db";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      localUser?: User;
    }
  }
}

const ADMIN_EMAILS = (process.env["AIVEC_ADMIN_EMAILS"] ?? "alameriendo@gmail.com,alameri_karim@yahoo.com")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

async function fetchClerkUser(clerkId: string): Promise<{
  email: string;
  firstName: string | null;
  lastName: string | null;
}> {
  try {
    const u = await clerkClient.users.getUser(clerkId);
    const email =
      u.primaryEmailAddress?.emailAddress ??
      u.emailAddresses[0]?.emailAddress ??
      "";
    return {
      email,
      firstName: u.firstName ?? null,
      lastName: u.lastName ?? null,
    };
  } catch {
    return { email: "", firstName: null, lastName: null };
  }
}

export async function getOrCreateLocalUser(
  clerkId: string,
): Promise<User> {
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId));
  if (existing) return existing;

  const profile = await fetchClerkUser(clerkId);
  const initialRole = ADMIN_EMAILS.includes(profile.email.toLowerCase())
    ? "admin"
    : "user";
  const [created] = await db
    .insert(usersTable)
    .values({
      clerkId,
      email: profile.email || `${clerkId}@unknown.local`,
      firstName: profile.firstName,
      lastName: profile.lastName,
      role: initialRole,
    })
    .returning();
  return created!;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    req.localUser = await getOrCreateLocalUser(clerkId);
    next();
  } catch (err) {
    req.log.error({ err }, "Failed to load local user");
    res.status(500).json({ error: "Failed to load user" });
  }
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  await requireAuth(req, res, () => {
    if (req.localUser?.role !== "admin") {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    next();
  });
}

export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (clerkId) {
    try {
      req.localUser = await getOrCreateLocalUser(clerkId);
    } catch (err) {
      req.log.warn({ err }, "optionalAuth: failed to load local user");
    }
  }
  next();
}
