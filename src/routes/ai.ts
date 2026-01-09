import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { suggestions, accounts } from "../db/schema";
import type { Bindings, Variables } from "../types";

export const aiRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Generate tweet suggestions
const generateSchema = z.object({
  accountId: z.string().uuid(),
  topic: z.string().min(1).max(200),
  tone: z.enum(["professional", "casual", "witty", "inspirational", "informative"]).default("casual"),
  count: z.number().min(1).max(5).default(3),
});

aiRouter.post("/generate", zValidator("json", generateSchema), async (c) => {
  const db = c.get("db");
  const ai = c.env.AI;
  const data = c.req.valid("json");

  // Get account info for context
  const account = await db.select()
    .from(accounts)
    .where(eq(accounts.id, data.accountId))
    .get();

  if (!account) {
    return c.json({ error: "Account not found" }, 404);
  }

  const prompt = `You are a social media expert helping @${account.username} create engaging tweets.

Topic: ${data.topic}
Tone: ${data.tone}
Generate ${data.count} unique tweet suggestions.

Requirements:
- Each tweet must be under 280 characters
- Include relevant hashtags where appropriate
- Make them engaging and shareable
- Match the requested tone

Return ONLY a JSON array of strings, each being a tweet. No other text.
Example: ["Tweet 1 content #hashtag", "Tweet 2 content", "Tweet 3 content #topic"]`;

  try {
    const response = await (ai as any).run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
    });

    let generatedTweets: string[] = [];

    // Parse the AI response
    const responseText = typeof response === "object" && "response" in response
      ? (response as { response: string }).response
      : String(response);

    try {
      // Try to extract JSON array from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        generatedTweets = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // If parsing fails, split by newlines and clean up
      generatedTweets = responseText
        .split("\n")
        .filter((line: string) => line.trim().length > 0 && line.length <= 280)
        .slice(0, data.count);
    }

    // Save suggestions to database
    const savedSuggestions = [];
    for (const content of generatedTweets) {
      const id = crypto.randomUUID();
      await db.insert(suggestions).values({
        id,
        accountId: data.accountId,
        content: content.slice(0, 280),
        topic: data.topic,
        tone: data.tone,
      });
      savedSuggestions.push({ id, content: content.slice(0, 280) });
    }

    return c.json({ suggestions: savedSuggestions });
  } catch (err) {
    const error = err instanceof Error ? err.message : "AI generation failed";
    return c.json({ error }, 500);
  }
});

// Analyze sentiment of text
const sentimentSchema = z.object({
  text: z.string().min(1).max(1000),
});

aiRouter.post("/sentiment", zValidator("json", sentimentSchema), async (c) => {
  const ai = c.env.AI;
  const { text } = c.req.valid("json");

  try {
    const response = await (ai as any).run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [{
        role: "user",
        content: `Analyze the sentiment of this text and return ONLY a JSON object with:
- score: number from -1 (very negative) to 1 (very positive)
- label: "positive", "negative", or "neutral"
- confidence: number from 0 to 1

Text: "${text}"

Return only the JSON, no other text.`,
      }],
      max_tokens: 100,
    });

    const responseText = typeof response === "object" && "response" in response
      ? (response as { response: string }).response
      : String(response);

    // Try to parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const sentiment = JSON.parse(jsonMatch[0]);
      return c.json({ sentiment });
    }

    return c.json({
      sentiment: { score: 0, label: "neutral", confidence: 0.5 },
      raw: responseText,
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Sentiment analysis failed";
    return c.json({ error }, 500);
  }
});

// Get hashtag suggestions
const hashtagSchema = z.object({
  topic: z.string().min(1).max(200),
  count: z.number().min(1).max(10).default(5),
});

aiRouter.post("/hashtags", zValidator("json", hashtagSchema), async (c) => {
  const ai = c.env.AI;
  const { topic, count } = c.req.valid("json");

  try {
    const response = await (ai as any).run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [{
        role: "user",
        content: `Suggest ${count} relevant and trending hashtags for a tweet about: "${topic}"

Requirements:
- Each hashtag should be relevant and commonly used
- Mix popular and niche hashtags for better reach
- No spaces, use CamelCase for multi-word tags

Return ONLY a JSON array of hashtags (include the # symbol).
Example: ["#Tech", "#Innovation", "#AI"]`,
      }],
      max_tokens: 200,
    });

    const responseText = typeof response === "object" && "response" in response
      ? (response as { response: string }).response
      : String(response);

    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const hashtags = JSON.parse(jsonMatch[0]);
      return c.json({ hashtags });
    }

    return c.json({ hashtags: [], raw: responseText });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Hashtag generation failed";
    return c.json({ error }, 500);
  }
});

// Improve/rewrite a tweet
const improveSchema = z.object({
  content: z.string().min(1).max(500),
  goal: z.enum(["engagement", "clarity", "professional", "viral"]).default("engagement"),
});

aiRouter.post("/improve", zValidator("json", improveSchema), async (c) => {
  const ai = c.env.AI;
  const { content, goal } = c.req.valid("json");

  try {
    const response = await (ai as any).run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [{
        role: "user",
        content: `Improve this tweet for maximum ${goal}:

Original: "${content}"

Requirements:
- Keep under 280 characters
- Maintain the core message
- Optimize for ${goal}
- Add relevant hashtags if appropriate

Return ONLY the improved tweet text, nothing else.`,
      }],
      max_tokens: 300,
    });

    const responseText = typeof response === "object" && "response" in response
      ? (response as { response: string }).response
      : String(response);

    const improved = responseText.trim().slice(0, 280);

    return c.json({ improved, original: content });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Tweet improvement failed";
    return c.json({ error }, 500);
  }
});

// List saved suggestions
aiRouter.get("/suggestions", async (c) => {
  const db = c.get("db");
  const accountId = c.req.query("accountId");
  const status = c.req.query("status");

  let query = db.select().from(suggestions);

  if (accountId) {
    query = query.where(eq(suggestions.accountId, accountId)) as typeof query;
  }

  const allSuggestions = await query;

  return c.json({ suggestions: allSuggestions });
});

// Update suggestion status
const updateSuggestionSchema = z.object({
  status: z.enum(["approved", "rejected", "used"]),
});

aiRouter.patch("/suggestions/:id", zValidator("json", updateSuggestionSchema), async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const { status } = c.req.valid("json");

  await db.update(suggestions).set({ status }).where(eq(suggestions.id, id));

  return c.json({ message: "Suggestion updated" });
});
