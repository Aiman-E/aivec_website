import type { Request, Response, NextFunction } from "express";
import type { User } from "@workspace/db";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      localUser?: User;
    }
  }
}

const USER_AUTH_DISABLED_MESSAGE =
  "Public user authentication is not configured for this deployment.";

export async function requireAuth(
  _req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  res.status(401).json({ error: USER_AUTH_DISABLED_MESSAGE });
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  await requireAuth(req, res, () => {
    if (req.localUser?.role === "admin") next();
    else res.status(403).json({ error: "Admin access required" });
  });
}

export async function optionalAuth(
  _req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  next();
}
