import { Router } from "express";
import { login, sessionFromToken, signup } from "../auth";
import { asyncHandler } from "./helpers";
import type { AuthedRequest } from "../middleware/access";
import { requireAuth } from "../middleware/access";

export const authRouter = Router();

authRouter.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const result = await signup(req.body || {});
    res.status(201).json({ data: result });
  }),
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const result = await login(req.body || {});
    res.json({ data: result });
  }),
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    const user = token ? await sessionFromToken(token) : req.user;
    res.json({ data: { user } });
  }),
);
