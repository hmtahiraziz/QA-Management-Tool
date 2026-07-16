import type { NextFunction, Request, Response } from "express";
import { sessionFromToken } from "../auth";
import type { AccessLevel, SessionUser } from "../types";

export type AuthedRequest = Request & {
  user?: SessionUser;
  access?: AccessLevel;
};

function extractBearerToken(req: Request) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
}

export async function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const user = await sessionFromToken(token);
    req.user = user;
    req.access = user.access;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session" });
  }
}

/** Reject writes unless the user has full (invited/admin) access. */
export function requireFullForWrites(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    next();
    return;
  }
  if (req.access !== "full") {
    res.status(403).json({
      error:
        "Read-only access. Ask an admin to invite your email on the Team members list.",
    });
    return;
  }
  next();
}

/** Team members APIs are invite-only (full access). */
export function requireFullAccess(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  if (req.access !== "full") {
    res.status(403).json({
      error: "Team members are only visible to invited users.",
    });
    return;
  }
  next();
}
