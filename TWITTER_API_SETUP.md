# Twitter API Setup Guide

This guide explains how to get Twitter API access for the Twitter Bot Dashboard.

## Step 1: Create a Twitter Developer Account

1. Go to [developer.twitter.com](https://developer.twitter.com/)
2. Click "Sign up" or "Apply" for developer access
3. Log in with your Twitter account
4. Fill out the application form:
   - **Use case**: Select "Building tools for Twitter users" or similar
   - **Description**: Explain you're building a dashboard for managing tweets
   - **Be honest**: Twitter reviews applications, so describe your actual use case

## Step 2: Create a Project and App

Once approved (can take 24-48 hours):

1. Go to the [Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Click "Create Project"
   - Name: `Twitter Bot Dashboard`
   - Use case: `Making a bot` or `Exploring the API`
3. Create an App within the project
   - App name: `twitter-bot-dashboard`

## Step 3: Get Your API Keys

In your app settings, you'll find:

### Essential Keys (Free Tier)
- **API Key** (Consumer Key)
- **API Key Secret** (Consumer Secret)
- **Bearer Token** - For read-only access to public data

### OAuth 2.0 Keys (For User Actions)
- **Client ID**
- **Client Secret**

## Step 4: Set Up OAuth 2.0 (For Posting Tweets)

1. In App Settings > User authentication settings
2. Click "Set up"
3. Configure:
   - **Type**: OAuth 2.0
   - **App permissions**: Read and Write
   - **Callback URL**: `https://twitter.hwmnbn.me/api/auth/callback`
   - **Website URL**: `https://twitter.hwmnbn.me`

## Step 5: Configure the Dashboard

Add your credentials to Cloudflare Workers secrets:

```bash
# Bearer token (for reading public data)
npx wrangler secret put TWITTER_BEARER_TOKEN

# OAuth 2.0 credentials (for posting)
npx wrangler secret put TWITTER_CLIENT_ID
npx wrangler secret put TWITTER_CLIENT_SECRET
```

Or add them in the Cloudflare Dashboard:
1. Go to Workers & Pages > twitter-bot-dashboard
2. Settings > Variables > Environment Variables
3. Add each secret as "Encrypted"

## Twitter API Tiers

### Free Tier
- 1,500 tweets read/month
- 50 tweets post/month
- Good for testing

### Basic Tier ($100/month)
- 10,000 tweets read/month
- 3,000 tweets post/month
- Good for small-scale use

### Pro Tier ($5,000/month)
- 1M tweets read/month
- 300,000 tweets post/month
- For agencies/businesses

## API Endpoints Used

The dashboard uses these Twitter API v2 endpoints:

### Read Operations (Bearer Token)
```
GET /2/users/by/username/:username  - Lookup user by handle
GET /2/users/:id/tweets             - Get user's tweets
GET /2/tweets/:id                   - Get tweet details
```

### Write Operations (OAuth 2.0)
```
POST /2/tweets                      - Post a tweet
DELETE /2/tweets/:id                - Delete a tweet
```

## Rate Limits

| Endpoint | Free Tier | Basic Tier |
|----------|-----------|------------|
| User lookup | 100/15min | 900/15min |
| User tweets | 100/15min | 900/15min |
| Post tweet | 50/24hr | 100/15min |

## Troubleshooting

### "Unauthorized" Error
- Check your Bearer Token is correct
- Ensure the token hasn't been regenerated

### "Rate Limited"
- You've hit API limits
- Wait 15 minutes and retry
- Consider upgrading your tier

### "Forbidden"
- Your app doesn't have the required permissions
- Update OAuth settings to include Read and Write

## Current Implementation Status

The dashboard currently uses **simulated data** for the Research feature. To enable real Twitter data:

1. Get API credentials (this guide)
2. Add them as secrets
3. The `src/routes/research.ts` file has TODO comments marking where to add real API calls

## Security Notes

- Never commit API keys to git
- Use Cloudflare secrets for all credentials
- Rotate keys if compromised
- Use OAuth 2.0 (not OAuth 1.0a) for better security
