import { Router } from "express";
import { getAppChoices } from "../choices-service";
import { asyncHandler } from "./helpers";

export const choicesRouter = Router();

choicesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const force = req.query.refresh === "1" || req.query.refresh === "true";
    const data = await getAppChoices(force);
    res.json({ data });
  }),
);
