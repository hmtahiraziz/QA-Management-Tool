import { Router } from "express";
import { testAirtableConnection } from "../airtable";
import { asyncHandler } from "./helpers";

export const healthRouter = Router();

healthRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const result = await testAirtableConnection();
    res.status(result.connected ? 200 : 503).json(result);
  }),
);
