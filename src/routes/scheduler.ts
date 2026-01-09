import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, lte, and, desc } from "drizzle-orm";
import { scheduledTweets, accounts, tweets } from "../db/schema";
import type { Bindings, Variables } from "../types";

export const schedulerRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// List scheduled tweets
schedulerRouter.get("/", async (c) => {
  const db = c.get("db");
  const accountId = c.req.query("accountId");
  const status = c.req.query("status");

  let query = db.select({
    id: scheduledTweets.id,
    content: scheduledTweets.content,
    scheduledFor: scheduledTweets.scheduledFor,
    status: scheduledTweets.status,
    aiGenerated: scheduledTweets.aiGenerated,
    account: {
      id: accounts.id,
      username: accounts.username,
    },
  })
    .from(scheduledTweets)
    .leftJoin(accounts, eq(scheduledTweets.accountId, accounts.id))
    .orderBy(desc(scheduledTweets.scheduledFor));

  if (accountId) {
    query = query.where(eq(scheduledTweets.accountId, accountId)) as typeof query;
  }

  const scheduled = await query;

  return c.json({ scheduled });
});

// Create scheduled tweet
const scheduleSchema = z.object({
  accountId: z.string().uuid(),
  content: z.string().min(1).max(280),
  scheduledFor: z.string().datetime(),
  mediaUrls: z.array(z.string().url()).optional(),
  aiGenerated: z.boolean().optional(),
});

schedulerRouter.post("/", zValidator("json", scheduleSchema), async (c) => {
  const db = c.get("db");
  const data = c.req.valid("json");

  const id = crypto.randomUUID();

  await db.insert(scheduledTweets).values({
    id,
    accountId: data.accountId,
    content: data.content,
    scheduledFor: new Date(data.scheduledFor),
    mediaUrls: data.mediaUrls ? JSON.stringify(data.mediaUrls) : null,
    aiGenerated: data.aiGenerated || false,
  });

  return c.json({ id, message: "Tweet scheduled" }, 201);
});

// Update scheduled tweet
const updateScheduleSchema = z.object({
  content: z.string().min(1).max(280).optional(),
  scheduledFor: z.string().datetime().optional(),
  status: z.enum(["pending", "cancelled"]).optional(),
});

schedulerRouter.patch("/:id", zValidator("json", updateScheduleSchema), async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const data = c.req.valid("json");

  const updateData: Record<string, unknown> = {};
  if (data.content) updateData.content = data.content;
  if (data.scheduledFor) updateData.scheduledFor = new Date(data.scheduledFor);
  if (data.status) updateData.status = data.status;

  await db.update(scheduledTweets).set(updateData).where(eq(scheduledTweets.id, id));

  return c.json({ message: "Scheduled tweet updated" });
});

// Delete scheduled tweet
schedulerRouter.delete("/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");

  await db.delete(scheduledTweets).where(eq(scheduledTweets.id, id));

  return c.json({ message: "Scheduled tweet deleted" });
});

// Process due tweets (called by Cron trigger)
schedulerRouter.post("/process", async (c) => {
  const db = c.get("db");
  const now = new Date();

  // Get all pending tweets that are due
  const dueTweets = await db.select()
    .from(scheduledTweets)
    .where(and(
      eq(scheduledTweets.status, "pending"),
      lte(scheduledTweets.scheduledFor, now)
    ));

  const results = [];

  for (const scheduled of dueTweets) {
    // Get account credentials
    const account = await db.select()
      .from(accounts)
      .where(eq(accounts.id, scheduled.accountId))
      .get();

    if (!account || !account.isActive) {
      await db.update(scheduledTweets)
        .set({ status: "failed", error: "Account not found or inactive" })
        .where(eq(scheduledTweets.id, scheduled.id));
      results.push({ id: scheduled.id, status: "failed", error: "Account issue" });
      continue;
    }

    try {
      // TODO: Implement actual Twitter API posting
      // For now, simulate success and record the tweet
      const tweetId = `sim_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      // Record to tweets history
      const recordId = crypto.randomUUID();
      await db.insert(tweets).values({
        id: recordId,
        accountId: account.id,
        tweetId,
        content: scheduled.content,
        postedAt: now,
      });

      // Mark as posted
      await db.update(scheduledTweets)
        .set({ status: "posted", tweetId })
        .where(eq(scheduledTweets.id, scheduled.id));

      results.push({ id: scheduled.id, status: "posted", tweetId });
    } catch (err) {
      const error = err instanceof Error ? err.message : "Unknown error";
      await db.update(scheduledTweets)
        .set({ status: "failed", error })
        .where(eq(scheduledTweets.id, scheduled.id));
      results.push({ id: scheduled.id, status: "failed", error });
    }
  }

  return c.json({ processed: results.length, results });
});
