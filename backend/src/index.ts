import "./dns-fix";
import { warmAirtableDns } from "./dns-fix";
import cors from "cors";
import express from "express";
import "./env";
import { getErrorMessage, getErrorStatus } from "./errors";
import {
  requireAuth,
  requireFullAccess,
  requireFullForWrites,
} from "./middleware/access";
import { authRouter } from "./routes/auth";
import { choicesRouter } from "./routes/choices";
import { healthRouter } from "./routes/health";
import {
  bugsRouter,
  projectsRouter,
  teamMembersRouter,
  testCasesRouter,
} from "./routes/resources";

const app = express();
const port = Number(process.env.PORT || 4000);
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

app.use(
  cors({
    origin: frontendOrigin,
  }),
);
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    name: "QA Test Management API",
    status: "ok",
    docs: {
      health: "/api/health",
      auth: "/api/auth",
      choices: "/api/choices",
      projects: "/api/projects",
      testCases: "/api/test-cases",
      teamMembers: "/api/team-members",
      bugs: "/api/bugs",
    },
  });
});

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);

app.use("/api/choices", requireAuth, choicesRouter);
app.use("/api/projects", requireAuth, requireFullForWrites, projectsRouter);
app.use("/api/test-cases", requireAuth, requireFullForWrites, testCasesRouter);
app.use(
  "/api/team-members",
  requireAuth,
  requireFullAccess,
  requireFullForWrites,
  teamMembersRouter,
);
app.use("/api/bugs", requireAuth, requireFullForWrites, bugsRouter);

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const message = getErrorMessage(err);
    const status = getErrorStatus(err);
    console.error(err);
    res.status(status).json({ error: message });
  },
);

warmAirtableDns()
  .catch((error) => {
    console.warn("Airtable DNS warm-up failed, starting anyway:", error);
  })
  .finally(() => {
    app.listen(port, () => {
      console.log(`Backend listening on http://localhost:${port}`);
    });
  });
