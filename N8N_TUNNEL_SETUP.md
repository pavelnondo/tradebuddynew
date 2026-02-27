# n8n Tunnel Setup Complete ✅

## Public URL for X.com OAuth

Your n8n instance is now accessible via a public tunnel:

**Public URL:** `https://shaggy-keys-stare.loca.lt`

## X.com Developer Portal Configuration

### Callback URL to Use:

```
https://shaggy-keys-stare.loca.lt/rest/oauth1-credential/callback
```

### Steps:

1. **Go to X.com Developer Portal**
   - Visit: https://developer.twitter.com/en/portal/dashboard
   - Navigate to your App settings

2. **Add Callback URL**
   - Go to "App settings" → "Callback URLs"
   - Add: `https://shaggy-keys-stare.loca.lt/rest/oauth1-credential/callback`
   - Save

3. **In n8n:**
   - Go to Settings → Credentials
   - Add "Twitter OAuth API" credential
   - The OAuth flow will now work with the public URL

## Current Configuration

n8n is running with:
- **Local URL:** http://localhost:5678
- **Public URL:** https://shaggy-keys-stare.loca.lt
- **Tunnel:** localtunnel (running in background)

## Important Notes

⚠️ **Tunnel URLs are temporary:**
- The localtunnel URL (`shaggy-keys-stare.loca.lt`) will change if you restart the tunnel
- For production, consider using:
  - ngrok with a paid plan (static domains)
  - Your own domain with proper SSL
  - Deploy n8n on your server

⚠️ **Keep the tunnel running:**
- The localtunnel process must stay running for OAuth to work
- If it stops, restart it with:
  ```bash
  npx -y localtunnel --port 5678
  ```

## Alternative: Use API Key/Secret (No Tunnel Needed)

If you don't want to use OAuth, you can use API Key/Secret authentication instead:

1. In n8n: Settings → Credentials → Add "Twitter API" (NOT OAuth)
2. Enter your API Key, Secret, Access Token, and Access Token Secret
3. No callback URL needed!

This is simpler and doesn't require a tunnel.

## Troubleshooting

### Tunnel stopped working?
```bash
# Check if localtunnel is running
ps aux | grep localtunnel

# Restart tunnel
npx -y localtunnel --port 5678
```

### n8n not accessible?
```bash
# Check if n8n is running
curl http://localhost:5678

# Restart n8n with tunnel URL
cd /Users/pavelnondo/tradebuddynew
N8N_EDITOR_BASE_URL=https://shaggy-keys-stare.loca.lt WEBHOOK_URL=https://shaggy-keys-stare.loca.lt/ npx n8n start
```

### Get new tunnel URL?
```bash
# Stop old tunnel and start new one
pkill -f localtunnel
npx -y localtunnel --port 5678
# Copy the new URL and update N8N_EDITOR_BASE_URL
```


