import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createDb } from "./db";
import type { Bindings, Variables } from "./types";
import { accountsRouter } from "./routes/accounts";
import { tweetsRouter } from "./routes/tweets";
import { schedulerRouter } from "./routes/scheduler";
import { aiRouter } from "./routes/ai";
import { researchRouter } from "./routes/research";
import { dashboardRouter } from "./routes/dashboard";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Middleware
app.use("*", logger());
app.use("*", cors());

// Database middleware
app.use("*", async (c, next) => {
  const db = createDb(c.env.DB);
  c.set("db", db);
  await next();
});

// Health check
app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

// API routes
app.route("/api/accounts", accountsRouter);
app.route("/api/tweets", tweetsRouter);
app.route("/api/scheduler", schedulerRouter);
app.route("/api/ai", aiRouter);
app.route("/api/research", researchRouter);

// Dashboard (serves HTML)
app.route("/", dashboardRouter);

export default app;
