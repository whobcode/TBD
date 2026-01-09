import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { publicAccounts, publicTweets } from "../db/schema";
import type { Bindings, Variables } from "../types";

export const researchRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// List all tracked public accounts (summary view)
researchRouter.get("/accounts", async (c) => {
  const db = c.get("db");

  const accounts = await db.select({
    id: publicAccounts.id,
    twitterId: publicAccounts.twitterId,
    username: publicAccounts.username,
    displayName: publicAccounts.displayName,
    profileImageUrl: publicAccounts.profileImageUrl,
    followersCount: publicAccounts.followersCount,
    followingCount: publicAccounts.followingCount,
    tweetCount: publicAccounts.tweetCount,
    verified: publicAccounts.verified,
    avgLikes: publicAccounts.avgLikes,
    avgRetweets: publicAccounts.avgRetweets,
    avgSentiment: publicAccounts.avgSentiment,
    postingFrequency: publicAccounts.postingFrequency,
    lastAnalyzed: publicAccounts.lastAnalyzed,
  }).from(publicAccounts).orderBy(desc(publicAccounts.createdAt));

  return c.json({ accounts });
});

// Get detailed view of a single account
researchRouter.get("/accounts/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");

  const account = await db.select().from(publicAccounts).where(eq(publicAccounts.id, id)).get();

  if (!account) {
    return c.json({ error: "Account not found" }, 404);
  }

  // Get recent tweets for this account
  const tweets = await db.select()
    .from(publicTweets)
    .where(eq(publicTweets.publicAccountId, id))
    .orderBy(desc(publicTweets.postedAt))
    .limit(100);

  // Calculate posting patterns
  const hourCounts: Record<number, number> = {};
  const dayCounts: Record<number, number> = {};

  for (const tweet of tweets) {
    if (tweet.postedAt) {
      const date = new Date(tweet.postedAt);
      const hour = date.getUTCHours();
      const day = date.getUTCDay();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    }
  }

  // Get top performing tweets
  const topTweets = [...tweets]
    .sort((a, b) => ((b.likes || 0) + (b.retweets || 0)) - ((a.likes || 0) + (a.retweets || 0)))
    .slice(0, 10);

  // Sentiment breakdown
  const sentimentBreakdown = {
    positive: tweets.filter(t => t.sentimentLabel === "positive").length,
    neutral: tweets.filter(t => t.sentimentLabel === "neutral").length,
    negative: tweets.filter(t => t.sentimentLabel === "negative").length,
  };

  return c.json({
    account,
    tweets,
    analytics: {
      hourlyActivity: hourCounts,
      dailyActivity: dayCounts,
      topTweets,
      sentimentBreakdown,
      totalTweetsAnalyzed: tweets.length,
    },
  });
});

// Lookup and add a new public account
const lookupSchema = z.object({
  username: z.string().min(1).max(50),
});

researchRouter.post("/lookup", zValidator("json", lookupSchema), async (c) => {
  const db = c.get("db");
  const { username } = c.req.valid("json");
  const cleanUsername = username.replace("@", "").trim();

  // Check if already tracking
  const existing = await db.select()
    .from(publicAccounts)
    .where(eq(publicAccounts.username, cleanUsername))
    .get();

  if (existing) {
    return c.json({ account: existing, message: "Already tracking this account" });
  }

  // TODO: Replace with actual Twitter API call
  // For now, create a placeholder that will be updated when Twitter API is configured
  //
  // Real implementation would be:
  // const twitterUser = await fetchTwitterUser(cleanUsername, c.env.TWITTER_BEARER_TOKEN);

  const id = crypto.randomUUID();
  const twitterId = `pending_${Date.now()}`;

  await db.insert(publicAccounts).values({
    id,
    twitterId,
    username: cleanUsername,
    displayName: cleanUsername,
  });

  const account = await db.select().from(publicAccounts).where(eq(publicAccounts.id, id)).get();

  return c.json({
    account,
    message: "Account added. Use /api/research/fetch/:id to fetch tweets.",
    note: "Twitter API integration required for full data"
  }, 201);
});

// Fetch tweets for a tracked account (simulated for now)
researchRouter.post("/fetch/:id", async (c) => {
  const db = c.get("db");
  const ai = c.env.AI;
  const id = c.req.param("id");

  const account = await db.select().from(publicAccounts).where(eq(publicAccounts.id, id)).get();

  if (!account) {
    return c.json({ error: "Account not found" }, 404);
  }

  // TODO: Replace with actual Twitter API call
  // Real implementation:
  // const tweets = await fetchUserTweets(account.twitterId, c.env.TWITTER_BEARER_TOKEN);

  // For demo purposes, generate sample data to show the UI works
  // This should be replaced with actual Twitter API data
  const sampleTweets = generateSampleTweets(account.username, 20);

  // Analyze sentiment for each tweet
  const analyzedTweets = [];
  for (const tweet of sampleTweets) {
    let sentiment = { score: 0, label: "neutral" };

    try {
      const response = await (ai as any).run("@cf/meta/llama-3.1-8b-instruct", {
        messages: [{
          role: "user",
          content: `Analyze sentiment. Return ONLY JSON: {"score": <-1 to 1>, "label": "<positive/neutral/negative>"}

Text: "${tweet.content}"`,
        }],
        max_tokens: 50,
      });

      const responseText = typeof response === "object" && "response" in response
        ? (response as { response: string }).response
        : String(response);

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        sentiment = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Default to neutral on error
    }

    const tweetId = crypto.randomUUID();

    // Extract hashtags
    const hashtagMatches = tweet.content.match(/#\w+/g) || [];

    await db.insert(publicTweets).values({
      id: tweetId,
      publicAccountId: id,
      tweetId: tweet.tweetId,
      content: tweet.content,
      likes: tweet.likes,
      retweets: tweet.retweets,
      replies: tweet.replies,
      quotes: tweet.quotes || 0,
      sentimentScore: sentiment.score,
      sentimentLabel: sentiment.label,
      hashtags: JSON.stringify(hashtagMatches),
      postedAt: tweet.postedAt,
    }).onConflictDoNothing();

    analyzedTweets.push({ ...tweet, sentiment });
  }

  // Update account analytics
  const allTweets = await db.select().from(publicTweets).where(eq(publicTweets.publicAccountId, id));

  const avgLikes = allTweets.reduce((sum, t) => sum + (t.likes || 0), 0) / allTweets.length || 0;
  const avgRetweets = allTweets.reduce((sum, t) => sum + (t.retweets || 0), 0) / allTweets.length || 0;
  const avgReplies = allTweets.reduce((sum, t) => sum + (t.replies || 0), 0) / allTweets.length || 0;
  const avgSentiment = allTweets.reduce((sum, t) => sum + (t.sentimentScore || 0), 0) / allTweets.length || 0;

  // Calculate posting frequency (tweets per day)
  const dates = allTweets.map(t => t.postedAt).filter(Boolean).sort();
  let postingFrequency = 0;
  if (dates.length > 1) {
    const firstDate = new Date(dates[0]!);
    const lastDate = new Date(dates[dates.length - 1]!);
    const daysDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
    postingFrequency = daysDiff > 0 ? allTweets.length / daysDiff : allTweets.length;
  }

  // Find most active hour
  const hourCounts: Record<number, number> = {};
  for (const tweet of allTweets) {
    if (tweet.postedAt) {
      const hour = new Date(tweet.postedAt).getUTCHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
  }
  const mostActiveHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  // Top hashtags
  const hashtagCounts: Record<string, number> = {};
  for (const tweet of allTweets) {
    const tags = tweet.hashtags ? JSON.parse(tweet.hashtags) : [];
    for (const tag of tags) {
      hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
    }
  }
  const topHashtags = Object.entries(hashtagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag);

  await db.update(publicAccounts).set({
    avgLikes,
    avgRetweets,
    avgReplies,
    avgSentiment,
    postingFrequency,
    mostActiveHour: mostActiveHour ? parseInt(mostActiveHour) : null,
    topHashtags: JSON.stringify(topHashtags),
    lastAnalyzed: new Date(),
    updatedAt: new Date(),
  }).where(eq(publicAccounts.id, id));

  return c.json({
    message: `Fetched and analyzed ${analyzedTweets.length} tweets`,
    tweetsAnalyzed: analyzedTweets.length,
  });
});

// Get tweets for an account with filters
researchRouter.get("/accounts/:id/tweets", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const sentiment = c.req.query("sentiment");
  const sortBy = c.req.query("sortBy") || "postedAt";
  const limit = parseInt(c.req.query("limit") || "50");

  let query = db.select()
    .from(publicTweets)
    .where(eq(publicTweets.publicAccountId, id))
    .limit(limit);

  const tweets = await query.orderBy(desc(publicTweets.postedAt));

  // Filter by sentiment if specified
  let filteredTweets = tweets;
  if (sentiment) {
    filteredTweets = tweets.filter(t => t.sentimentLabel === sentiment);
  }

  // Sort
  if (sortBy === "likes") {
    filteredTweets.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  } else if (sortBy === "retweets") {
    filteredTweets.sort((a, b) => (b.retweets || 0) - (a.retweets || 0));
  } else if (sortBy === "engagement") {
    filteredTweets.sort((a, b) =>
      ((b.likes || 0) + (b.retweets || 0) + (b.replies || 0)) -
      ((a.likes || 0) + (a.retweets || 0) + (a.replies || 0))
    );
  }

  return c.json({ tweets: filteredTweets });
});

// Analyze content strategy for an account
researchRouter.get("/accounts/:id/strategy", async (c) => {
  const db = c.get("db");
  const ai = c.env.AI;
  const id = c.req.param("id");

  const account = await db.select().from(publicAccounts).where(eq(publicAccounts.id, id)).get();

  if (!account) {
    return c.json({ error: "Account not found" }, 404);
  }

  const tweets = await db.select()
    .from(publicTweets)
    .where(eq(publicTweets.publicAccountId, id))
    .orderBy(desc(publicTweets.postedAt))
    .limit(50);

  if (tweets.length === 0) {
    return c.json({ error: "No tweets to analyze. Fetch tweets first." }, 400);
  }

  // Get top performing tweets
  const topTweets = [...tweets]
    .sort((a, b) => ((b.likes || 0) + (b.retweets || 0)) - ((a.likes || 0) + (a.retweets || 0)))
    .slice(0, 5)
    .map(t => t.content);

  try {
    const response = await (ai as any).run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [{
        role: "user",
        content: `Analyze this Twitter account's content strategy based on their top performing tweets.

Account: @${account.username}
Avg Likes: ${account.avgLikes?.toFixed(1)}
Avg Retweets: ${account.avgRetweets?.toFixed(1)}
Posting Frequency: ${account.postingFrequency?.toFixed(1)} tweets/day
Top Hashtags: ${account.topHashtags || "none"}

Top performing tweets:
${topTweets.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Provide a brief analysis (3-4 paragraphs) covering:
1. Content themes and topics they focus on
2. Tone and style (formal, casual, humorous, etc.)
3. What makes their top tweets successful
4. Recommendations for someone wanting similar engagement`,
      }],
      max_tokens: 800,
    });

    const responseText = typeof response === "object" && "response" in response
      ? (response as { response: string }).response
      : String(response);

    return c.json({ analysis: responseText });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Analysis failed";
    return c.json({ error }, 500);
  }
});

// Delete a tracked account
researchRouter.delete("/accounts/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");

  // Delete tweets first
  await db.delete(publicTweets).where(eq(publicTweets.publicAccountId, id));
  // Delete account
  await db.delete(publicAccounts).where(eq(publicAccounts.id, id));

  return c.json({ message: "Account and tweets deleted" });
});

// Helper function to generate sample tweets (replace with real Twitter API)
function generateSampleTweets(username: string, count: number) {
  const sampleContents = [
    "Just shipped a new feature! The team worked incredibly hard on this. #buildinpublic #startup",
    "Hot take: most productivity advice is just procrastination with extra steps",
    "Grateful for the amazing community we've built here. You all inspire me daily!",
    "The best time to start was yesterday. The second best time is now. #motivation",
    "Debugging at 2am hits different. Coffee is my only friend right now",
    "Unpopular opinion: meetings could always be emails",
    "Just hit 10k followers! Thank you all for the support #milestone",
    "Thread on what I learned building my first SaaS:",
    "The secret to success? Show up every day, even when you don't feel like it",
    "New blog post is live! Link in bio #contentcreation",
    "Sometimes the best code is no code at all",
    "Excited to announce our Series A! More details coming soon #funding",
    "Monday motivation: Your only competition is who you were yesterday",
    "Just discovered this amazing tool that changed my workflow completely",
    "The internet is undefeated today lol",
    "Building in public update: Week 12 revenue report inside",
    "This tweet will probably flop but I don't care",
    "Friendly reminder to drink water and touch grass today",
    "AI is not going to take your job. Someone using AI will.",
    "The best investment you can make is in yourself #growth",
  ];

  const tweets = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const content = sampleContents[i % sampleContents.length];
    const daysAgo = Math.floor(Math.random() * 30);
    const hoursAgo = Math.floor(Math.random() * 24);

    tweets.push({
      tweetId: `sample_${Date.now()}_${i}`,
      content,
      likes: Math.floor(Math.random() * 500) + 10,
      retweets: Math.floor(Math.random() * 100) + 1,
      replies: Math.floor(Math.random() * 50),
      quotes: Math.floor(Math.random() * 20),
      postedAt: new Date(now - (daysAgo * 24 + hoursAgo) * 60 * 60 * 1000),
    });
  }

  return tweets;
}
