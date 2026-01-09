import type { Database } from "./db";

export type Bindings = {
  DB: D1Database;
  AI: Ai;
  SESSIONS: KVNamespace;
  ENVIRONMENT: string;
  TWITTER_CLIENT_ID?: string;
  TWITTER_CLIENT_SECRET?: string;
};

export type Variables = {
  db: Database;
};
