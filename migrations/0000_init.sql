-- Twitter Bot Dashboard Schema

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  display_name TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expiry INTEGER,
  profile_image_url TEXT,
  followers_count INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER,
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS scheduled_tweets (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  content TEXT NOT NULL,
  media_urls TEXT,
  scheduled_for INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'posted', 'failed', 'cancelled')),
  tweet_id TEXT,
  error TEXT,
  ai_generated INTEGER DEFAULT 0,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS tweets (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  tweet_id TEXT NOT NULL,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  retweets INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  sentiment_score REAL,
  posted_at INTEGER NOT NULL,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS suggestions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  content TEXT NOT NULL,
  topic TEXT,
  tone TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'used')),
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS hashtags (
  id TEXT PRIMARY KEY,
  tag TEXT NOT NULL UNIQUE,
  use_count INTEGER DEFAULT 0,
  avg_engagement REAL DEFAULT 0,
  last_used INTEGER
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_tweets_account ON scheduled_tweets(account_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tweets_status ON scheduled_tweets(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_tweets_scheduled_for ON scheduled_tweets(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_tweets_account ON tweets(account_id);
CREATE INDEX IF NOT EXISTS idx_tweets_posted_at ON tweets(posted_at);
CREATE INDEX IF NOT EXISTS idx_suggestions_account ON suggestions(account_id);
