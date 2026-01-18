# Setting Up Webhooks for Localhost Development

## The Problem

**WSAPME cannot reach `localhost:3000` or `127.0.0.1:3000`** because:
- `localhost` only refers to your local machine
- External services (like WSAPME servers) can't access your localhost
- You need a public URL that tunnels to your localhost

## Solution: Use a Tunneling Service

You have several options:

### Option 1: ngrok (Recommended)

1. **Install ngrok:**
   ```bash
   # Download from https://ngrok.com/download
   # Or use npm:
   npm install -g ngrok
   ```

2. **Start your Next.js dev server:**
   ```bash
   npm run dev
   ```

3. **In a new terminal, create tunnel:**
   ```bash
   ngrok http 3000
   ```

4. **You'll get a URL like:**
   ```
   Forwarding: https://abc123.ngrok.io -> http://localhost:3000
   ```

5. **Use this URL in WSAPME:**
   ```
   https://abc123.ngrok.io/api/webhook/wsapme
   ```

**Note:** Free ngrok URLs change every time you restart (unless you have a paid plan)

### Option 2: Cloudflared (Cloudflare Tunnel)

1. **Install cloudflared:**
   ```bash
   # Download from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
   ```

2. **Create tunnel:**
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```

3. **Use the provided URL in WSAPME**

### Option 3: localtunnel (npm package)

1. **Install:**
   ```bash
   npm install -g localtunnel
   ```

2. **Create tunnel:**
   ```bash
   lt --port 3000
   ```

3. **Use the provided URL in WSAPME**

### Option 4: Webhook.site (For Testing Only)

**Good for quick testing, but not for development:**

1. Go to https://webhook.site
2. Copy the unique URL provided
3. Set it as webhook URL in WSAPME
4. Send test messages and see payloads on webhook.site

**Limitations:**
- URL expires after some time
- Can't process/handle webhooks in your app
- Good for seeing what WSAPME sends

## Recommended Setup for Development

**Use ngrok for local development:**

1. Start Next.js: `npm run dev`
2. Start ngrok: `ngrok http 3000`
3. Copy ngrok URL (e.g., `https://abc123.ngrok.io`)
4. Configure in WSAPME: `https://abc123.ngrok.io/api/webhook/wsapme`
5. Test by sending a message
6. Check terminal logs in your Next.js app for webhook payloads

## Production Setup

For production, deploy your app to:
- **Vercel** (easiest for Next.js)
- **Railway**
- **Heroku**
- **Any hosting with public URL**

Then use your production URL:
```
https://your-app.vercel.app/api/webhook/wsapme
```

## Testing the Webhook Endpoint

Once tunnel is set up:

1. **Test with GET (check if endpoint is accessible):**
   ```
   GET https://your-tunnel-url.ngrok.io/api/webhook/wsapme
   ```

2. **Should return:**
   ```json
   {
     "message": "WSAPME Webhook endpoint is active",
     "endpoint": "/api/webhook/wsapme",
     "method": "POST"
   }
   ```

3. **Configure in WSAPME:**
   - Device level: Settings → Webhook URL → `https://your-tunnel-url.ngrok.io/api/webhook/wsapme`
   - Enable status notifications if option exists

4. **Send test message** and check terminal logs

## Security Note

When using tunnels:
- URLs are public (anyone with URL can access)
- Use HTTPS tunnels (ngrok provides this)
- Don't commit tunnel URLs to git
- For production, use proper authentication/authorization

