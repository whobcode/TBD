-- Public accounts for research/tracking
CREATE TABLE IF NOT EXISTS public_accounts (
  id TEXT PRIMARY KEY,
  twitter_id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  display_name TEXT,
  bio TEXT,
  profile_image_url TEXT,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  tweet_count INTEGER DEFAULT 0,
  verified INTEGER DEFAULT 0,
  avg_likes REAL DEFAULT 0,
  avg_retweets REAL DEFAULT 0,
  avg_replies REAL DEFAULT 0,
  avg_sentiment REAL,
  posting_frequency REAL,
  most_active_hour INTEGER,
  top_hashtags TEXT,
  last_analyzed INTEGER,
  created_at INTEGER,
  updated_at INTEGER
);

-- Tweets from public accounts
CREATE TABLE IF NOT EXISTS public_tweets (
  id TEXT PRIMARY KEY,
  public_account_id TEXT NOT NULL REFERENCES public_accounts(id),
  tweet_id TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  retweets INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  quotes INTEGER DEFAULT 0,
  sentiment_score REAL,
  sentiment_label TEXT,
  hashtags TEXT,
  posted_at INTEGER NOT NULL,
  fetched_at INTEGER
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_public_accounts_username ON public_accounts(username);
CREATE INDEX IF NOT EXISTS idx_public_tweets_account ON public_tweets(public_account_id);
CREATE INDEX IF NOT EXISTS idx_public_tweets_posted_at ON public_tweets(posted_at);
