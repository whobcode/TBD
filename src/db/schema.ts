import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// Twitter bot accounts
export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  username: text("username").notNull(),
  displayName: text("display_name"),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  tokenExpiry: integer("token_expiry"),
  profileImageUrl: text("profile_image_url"),
  followersCount: integer("followers_count").default(0),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Scheduled tweets
export const scheduledTweets = sqliteTable("scheduled_tweets", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull().references(() => accounts.id),
  content: text("content").notNull(),
  mediaUrls: text("media_urls"), // JSON array
  scheduledFor: integer("scheduled_for", { mode: "timestamp" }).notNull(),
  status: text("status", { enum: ["pending", "posted", "failed", "cancelled"] }).default("pending"),
  tweetId: text("tweet_id"), // Twitter's tweet ID after posting
  error: text("error"),
  aiGenerated: integer("ai_generated", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Tweet history (posted tweets)
export const tweets = sqliteTable("tweets", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull().references(() => accounts.id),
  tweetId: text("tweet_id").notNull(),
  content: text("content").notNull(),
  likes: integer("likes").default(0),
  retweets: integer("retweets").default(0),
  replies: integer("replies").default(0),
  impressions: integer("impressions").default(0),
  sentimentScore: real("sentiment_score"),
  postedAt: integer("posted_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// AI-generated content suggestions
export const suggestions = sqliteTable("suggestions", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull().references(() => accounts.id),
  content: text("content").notNull(),
  topic: text("topic"),
  tone: text("tone"),
  status: text("status", { enum: ["pending", "approved", "rejected", "used"] }).default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Hashtag analytics
export const hashtags = sqliteTable("hashtags", {
  id: text("id").primaryKey(),
  tag: text("tag").notNull().unique(),
  useCount: integer("use_count").default(0),
  avgEngagement: real("avg_engagement").default(0),
  lastUsed: integer("last_used", { mode: "timestamp" }),
});

// Public accounts for research/tracking
export const publicAccounts = sqliteTable("public_accounts", {
  id: text("id").primaryKey(),
  twitterId: text("twitter_id").notNull().unique(),
  username: text("username").notNull(),
  displayName: text("display_name"),
  bio: text("bio"),
  profileImageUrl: text("profile_image_url"),
  followersCount: integer("followers_count").default(0),
  followingCount: integer("following_count").default(0),
  tweetCount: integer("tweet_count").default(0),
  verified: integer("verified", { mode: "boolean" }).default(false),
  // Computed analytics
  avgLikes: real("avg_likes").default(0),
  avgRetweets: real("avg_retweets").default(0),
  avgReplies: real("avg_replies").default(0),
  avgSentiment: real("avg_sentiment"),
  postingFrequency: real("posting_frequency"), // tweets per day
  mostActiveHour: integer("most_active_hour"), // 0-23
  topHashtags: text("top_hashtags"), // JSON array
  lastAnalyzed: integer("last_analyzed", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Tweets from public accounts
export const publicTweets = sqliteTable("public_tweets", {
  id: text("id").primaryKey(),
  publicAccountId: text("public_account_id").notNull().references(() => publicAccounts.id),
  tweetId: text("tweet_id").notNull().unique(),
  content: text("content").notNull(),
  likes: integer("likes").default(0),
  retweets: integer("retweets").default(0),
  replies: integer("replies").default(0),
  quotes: integer("quotes").default(0),
  sentimentScore: real("sentiment_score"),
  sentimentLabel: text("sentiment_label"),
  hashtags: text("hashtags"), // JSON array
  postedAt: integer("posted_at", { mode: "timestamp" }).notNull(),
  fetchedAt: integer("fetched_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Type exports
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type ScheduledTweet = typeof scheduledTweets.$inferSelect;
export type NewScheduledTweet = typeof scheduledTweets.$inferInsert;
export type Tweet = typeof tweets.$inferSelect;
export type Suggestion = typeof suggestions.$inferSelect;
export type PublicAccount = typeof publicAccounts.$inferSelect;
export type NewPublicAccount = typeof publicAccounts.$inferInsert;
export type PublicTweet = typeof publicTweets.$inferSelect;
export type NewPublicTweet = typeof publicTweets.$inferInsert;
