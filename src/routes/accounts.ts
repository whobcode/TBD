import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { accounts } from "../db/schema";
import type { Bindings, Variables } from "../types";

export const accountsRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// List all accounts
accountsRouter.get("/", async (c) => {
  const db = c.get("db");
  const allAccounts = await db.select({
    id: accounts.id,
    username: accounts.username,
    displayName: accounts.displayName,
    profileImageUrl: accounts.profileImageUrl,
    followersCount: accounts.followersCount,
    isActive: accounts.isActive,
    createdAt: accounts.createdAt,
  }).from(accounts);

  return c.json({ accounts: allAccounts });
});

// Get single account
accountsRouter.get("/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");

  const account = await db.select({
    id: accounts.id,
    username: accounts.username,
    displayName: accounts.displayName,
    profileImageUrl: accounts.profileImageUrl,
    followersCount: accounts.followersCount,
    isActive: accounts.isActive,
    createdAt: accounts.createdAt,
  }).from(accounts).where(eq(accounts.id, id)).get();

  if (!account) {
    return c.json({ error: "Account not found" }, 404);
  }

  return c.json({ account });
});

// Create account (manual entry for now, OAuth later)
const createAccountSchema = z.object({
  username: z.string().min(1).max(50),
  displayName: z.string().optional(),
  accessToken: z.string().min(1),
  refreshToken: z.string().optional(),
});

accountsRouter.post("/", zValidator("json", createAccountSchema), async (c) => {
  const db = c.get("db");
  const data = c.req.valid("json");

  const id = crypto.randomUUID();

  await db.insert(accounts).values({
    id,
    username: data.username,
    displayName: data.displayName,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });

  return c.json({ id, message: "Account created" }, 201);
});

// Update account
const updateAccountSchema = z.object({
  displayName: z.string().optional(),
  isActive: z.boolean().optional(),
});

accountsRouter.patch("/:id", zValidator("json", updateAccountSchema), async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const data = c.req.valid("json");

  await db.update(accounts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(accounts.id, id));

  return c.json({ message: "Account updated" });
});

// Delete account
accountsRouter.delete("/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");

  await db.delete(accounts).where(eq(accounts.id, id));

  return c.json({ message: "Account deleted" });
});
