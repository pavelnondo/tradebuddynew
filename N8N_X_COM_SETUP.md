# n8n X.com (Twitter) API Setup Guide

## 🚀 Quick Answer: Can't Use localhost?

**X.com doesn't allow `localhost` URLs for OAuth callbacks.**

### ✅ Solution: Use API Key/Secret Instead (Easiest)

**Don't use "Twitter OAuth API"** - instead use **"Twitter API"** credential type in n8n. This uses API Key/Secret authentication and doesn't need OAuth callbacks at all!

1. In n8n: Settings → Credentials → Add Credential
2. Search for "Twitter" 
3. Select **"Twitter API"** (NOT "Twitter OAuth API")
4. Enter your API Key, API Secret, Access Token, and Access Token Secret
5. Done! No callback URL needed.

### Alternative: Use ngrok for OAuth

If you specifically need OAuth:
1. Install ngrok: `brew install ngrok`
2. Run: `ngrok http 5678`
3. Use the ngrok HTTPS URL in X.com Developer Portal
4. Set `N8N_EDITOR_BASE_URL` to the ngrok URL

---

## Step 1: Get X.com API Credentials

1. **Go to X Developer Portal**
   - Visit: https://developer.twitter.com/en/portal/dashboard
   - Sign in with your X.com account

2. **Create a Project & App**
   - Click "Create Project" or use existing project
   - Create a new App within the project
   - Note: Free tier has rate limits

3. **Get Your Credentials**
   You'll need these credentials:
   - **API Key** (Consumer Key)
   - **API Secret** (Consumer Secret)
   - **Access Token**
   - **Access Token Secret**
   - **Bearer Token** (for v2 API - optional but recommended)

4. **Set App Permissions**
   - Go to "Keys and tokens" tab
   - Set permissions (Read, Write, Read and Write) based on what you need
   - Regenerate tokens if needed

## Step 2: Add Credentials in n8n

### ⚠️ Important: OAuth vs API Key Authentication

**X.com doesn't allow `localhost` URLs for OAuth callbacks.** You have two options:

### Option A: Use API Key/Secret (Recommended - No OAuth Needed)

This is the **easiest method** and doesn't require OAuth callbacks:

1. **Open n8n**
   - Go to http://localhost:5678
   - Log in if required

2. **Navigate to Credentials**
   - Click on **Settings** (gear icon) in the left sidebar
   - Click on **Credentials**

3. **Add Twitter/X Credential**
   - Click **Add Credential** button
   - Search for **"Twitter"** or **"X"**
   - Select **"Twitter API"** (NOT "Twitter OAuth API")
   - This uses API Key/Secret authentication, no OAuth callback needed!

4. **Fill in Credentials**
   ```
   Credential Name: X.com API (or your preferred name)
   
   API Key: [Your API Key from X Developer Portal]
   API Secret: [Your API Secret]
   Access Token: [Your Access Token]
   Access Token Secret: [Your Access Token Secret]
   
   Optional:
   Bearer Token: [Your Bearer Token for v2 API]
   ```

5. **Test Connection**
   - Click **Test** to verify credentials work
   - Save if test succeeds

### Option B: Use OAuth with Public URL (If You Need OAuth)

If you specifically need OAuth authentication, you'll need a public URL:

#### Method 1: Use ngrok (Recommended for OAuth)

1. **Install ngrok:**
   ```bash
   # macOS
   brew install ngrok
   
   # Or download from https://ngrok.com/download
   ```

2. **Start ngrok tunnel:**
   ```bash
   ngrok http 5678
   ```

3. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

4. **Configure n8n with public URL:**
   ```bash
   export N8N_EDITOR_BASE_URL=https://abc123.ngrok.io
   export WEBHOOK_URL=https://abc123.ngrok.io/
   ```

5. **Restart n8n** with these environment variables

6. **In X.com Developer Portal**, use:
   ```
   https://abc123.ngrok.io/rest/oauth1-credential/callback
   ```

#### Method 2: Use localtunnel (Built into n8n)

n8n has localtunnel built-in. You can enable it:

1. **Set environment variables:**
   ```bash
   export N8N_EDITOR_BASE_URL=https://your-tunnel-url.loca.lt
   export N8N_TUNNEL=true
   ```

2. **Restart n8n** - it will automatically create a tunnel

3. **Use the tunnel URL** in X.com Developer Portal

#### Method 3: Use Your Production Server

If you have a production server (like `217.151.231.249`), you can:

1. **Set up n8n on your server** with proper domain/SSL
2. **Use that URL** for OAuth callbacks:
   ```
   https://your-domain.com/rest/oauth1-credential/callback
   ```

### Method 3: Via Environment Variables (For Production)

Add to your n8n environment or `.env`:

```bash
# X.com API Credentials
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret
TWITTER_BEARER_TOKEN=your_bearer_token
```

## Step 3: Available X.com Nodes in n8n

### Twitter v2 API Nodes (Recommended)
- **Tweet** - Create, read, update, delete tweets
- **User** - Get user information
- **Search** - Search tweets
- **List** - Manage lists
- **Media** - Upload media

### Twitter v1.1 API Nodes (Legacy)
- **Tweet** - Basic tweet operations
- **User** - User operations
- **Search** - Search functionality

## Step 4: Example Workflow

### Basic Tweet Posting Workflow

1. **Trigger Node** (e.g., Webhook, Schedule)
2. **Twitter v2 - Tweet Node**
   - Select your credential
   - Operation: Create Tweet
   - Text: Your tweet content
   - Additional options:
     - Reply to tweet ID
     - Media IDs
     - Poll options

### Search Tweets Workflow

1. **Trigger Node**
2. **Twitter v2 - Search Node**
   - Select your credential
   - Query: Your search query (e.g., "tradebuddy OR trading")
   - Max Results: Number of tweets to retrieve
   - Additional filters:
     - Language
     - Date range
     - User filters

### Monitor Mentions Workflow

1. **Schedule Trigger** (runs every X minutes)
2. **Twitter v2 - Search Node**
   - Query: `@your_username`
   - Get recent mentions
3. **Process Results**
   - Filter, analyze, or forward mentions

## Step 5: Rate Limits

### Free Tier Limits
- **Tweet Creation**: 1,500 tweets/month
- **Read Operations**: Varies by endpoint
- **Search**: Limited requests per 15 minutes

### Best Practices
- Use webhooks where possible (requires paid tier)
- Implement rate limiting in workflows
- Cache results when appropriate
- Use batch operations efficiently

## Step 6: Security Best Practices

1. **Never Commit Credentials**
   - Use environment variables
   - Store in n8n credential system
   - Use secret management tools

2. **Rotate Credentials Regularly**
   - Regenerate tokens periodically
   - Update credentials in n8n

3. **Limit Permissions**
   - Only grant necessary permissions
   - Use read-only tokens when possible

4. **Monitor Usage**
   - Check API usage in X Developer Portal
   - Set up alerts for unusual activity

## Step 7: Testing Your Setup

### Test Tweet Posting
1. Create a simple workflow
2. Add Twitter v2 - Tweet node
3. Set text: "Test from n8n"
4. Execute workflow
5. Check your X.com account for the tweet

### Test Search
1. Create workflow with Twitter v2 - Search node
2. Query: "n8n automation"
3. Execute and verify results

## Troubleshooting

### Common Issues

1. **"Invalid or expired token"**
   - Regenerate tokens in X Developer Portal
   - Update credentials in n8n

2. **"Rate limit exceeded"**
   - Wait for rate limit window to reset
   - Implement delays in workflows
   - Consider upgrading API tier

3. **"Forbidden" error**
   - Check app permissions
   - Verify OAuth scopes
   - Ensure tokens have correct permissions

4. **"Not found" errors**
   - Verify tweet IDs or user IDs
   - Check if content exists
   - Ensure you have access

## Integration with TradeBuddy

### Example: Post Trade Updates to X.com

```json
{
  "workflow": [
    {
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "trade-update"
      }
    },
    {
      "type": "n8n-nodes-base.twitter",
      "parameters": {
        "operation": "create",
        "text": "=New trade: {{ $json.symbol }} {{ $json.type }} at ${{ $json.entry_price }}"
      }
    }
  ]
}
```

### Example: Monitor Trading Mentions

1. **Schedule Trigger** (every 15 minutes)
2. **Twitter Search** - Search for "@yourhandle tradebuddy"
3. **Process Mentions** - Extract trade info
4. **Forward to Backend** - Send to TradeBuddy API

## Next Steps

1. ✅ Get X.com API credentials
2. ✅ Add credentials to n8n
3. ✅ Test basic tweet operation
4. ✅ Create your first X.com workflow
5. ✅ Integrate with TradeBuddy workflows

## Resources

- X.com API Documentation: https://developer.twitter.com/en/docs
- n8n Twitter Nodes: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.twitter/
- X.com Developer Portal: https://developer.twitter.com/en/portal/dashboard

