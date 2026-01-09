import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { tweets, accounts } from "../db/schema";
import type { Bindings, Variables } from "../types";

export const tweetsRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// List tweets with pagination
tweetsRouter.get("/", async (c) => {
  const db = c.get("db");
  const accountId = c.req.query("accountId");
  const limit = parseInt(c.req.query("limit") || "50");
  const offset = parseInt(c.req.query("offset") || "0");

  let query = db.select({
    id: tweets.id,
    tweetId: tweets.tweetId,
    content: tweets.content,
    likes: tweets.likes,
    retweets: tweets.retweets,
    replies: tweets.replies,
    impressions: tweets.impressions,
    sentimentScore: tweets.sentimentScore,
    postedAt: tweets.postedAt,
    account: {
      id: accounts.id,
      username: accounts.username,
    },
  })
    .from(tweets)
    .leftJoin(accounts, eq(tweets.accountId, accounts.id))
    .orderBy(desc(tweets.postedAt))
    .limit(limit)
    .offset(offset);

  if (accountId) {
    query = query.where(eq(tweets.accountId, accountId)) as typeof query;
  }

  const allTweets = await query;

  return c.json({ tweets: allTweets });
});

// Get analytics summary
tweetsRouter.get("/analytics", async (c) => {
  const db = c.get("db");
  const accountId = c.req.query("accountId");

  const baseQuery = accountId
    ? sql`SELECT
        COUNT(*) as total_tweets,
        COALESCE(SUM(likes), 0) as total_likes,
        COALESCE(SUM(retweets), 0) as total_retweets,
        COALESCE(SUM(replies), 0) as total_replies,
        COALESCE(SUM(impressions), 0) as total_impressions,
        COALESCE(AVG(sentiment_score), 0) as avg_sentiment
      FROM tweets WHERE account_id = ${accountId}`
    : sql`SELECT
        COUNT(*) as total_tweets,
        COALESCE(SUM(likes), 0) as total_likes,
        COALESCE(SUM(retweets), 0) as total_retweets,
        COALESCE(SUM(replies), 0) as total_replies,
        COALESCE(SUM(impressions), 0) as total_impressions,
        COALESCE(AVG(sentiment_score), 0) as avg_sentiment
      FROM tweets`;

  const result = await db.run(baseQuery);
  const analytics = result.results[0] || {};

  return c.json({ analytics });
});

// Get single tweet
tweetsRouter.get("/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");

  const tweet = await db.select().from(tweets).where(eq(tweets.id, id)).get();

  if (!tweet) {
    return c.json({ error: "Tweet not found" }, 404);
  }

  return c.json({ tweet });
});

// Record a posted tweet
const createTweetSchema = z.object({
  accountId: z.string().uuid(),
  tweetId: z.string(),
  content: z.string(),
  postedAt: z.string().datetime(),
});

tweetsRouter.post("/", zValidator("json", createTweetSchema), async (c) => {
  const db = c.get("db");
  const data = c.req.valid("json");

  const id = crypto.randomUUID();

  await db.insert(tweets).values({
    id,
    accountId: data.accountId,
    tweetId: data.tweetId,
    content: data.content,
    postedAt: new Date(data.postedAt),
  });

  return c.json({ id }, 201);
});

// Update tweet metrics
const updateTweetSchema = z.object({
  likes: z.number().optional(),
  retweets: z.number().optional(),
  replies: z.number().optional(),
  impressions: z.number().optional(),
  sentimentScore: z.number().min(-1).max(1).optional(),
});

tweetsRouter.patch("/:id", zValidator("json", updateTweetSchema), async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const data = c.req.valid("json");

  await db.update(tweets).set(data).where(eq(tweets.id, id));

  return c.json({ message: "Tweet updated" });
});
