# Debugging Guide

## About "Compiling..." in Browser

The **"compiling..."** message at the bottom left of your browser is **NORMAL** behavior in Next.js development mode.

**What it means:**
- Next.js is compiling your code in the background
- Happens when files change or during hot module replacement (HMR)
- It's informational, not an error
- The app continues to work normally

**When you see it:**
- After saving a file
- During initial page load
- When Next.js rebuilds changed modules

**This is expected and not a problem!**

---

## Debugging Status Check Issues

### Terminal Logging

The code now includes detailed logging. When you test message status:

1. **Check your terminal** (where `npm run dev` is running)
2. Look for logs prefixed with `[DEBUG]`, `[ERROR]`, `[WSAPME API]`
3. All API requests and responses are logged

### What to Look For

#### 1. Message Send Success
```
[DEBUG] Message sent successfully
[DEBUG] Message ID: <your-message-id>
```

#### 2. Status Check Request
```
========== MESSAGE STATUS CHECK START ==========
[DEBUG] Received request body: {...}
[DEBUG] Using JID: 60189026292@s.whatsapp.net
[DEBUG] Message ID: <your-message-id>
```

#### 3. WSAPME API Call
```
[WSAPME API] Calling messageInfo endpoint: https://master.wsapme.com/api/messageInfo
[WSAPME API] Request payload: {...}
[WSAPME API] Response status: 200 OK
[WSAPME API] Raw response: {...}
```

#### 4. Errors
```
[ERROR] Error message: ...
[ERROR] Error stack: ...
```

---

## Common Issues & Solutions

### Issue: "messageId is missing"

**Log shows:**
```
[ERROR] messageId is missing in request
```

**Solution:**
- Check that send message returned a messageId
- Verify messageId is being passed to status check

---

### Issue: "Unauthorised Token"

**Log shows:**
```
[WSAPME API] Response status: 401 Unauthorized
```

**Solution:**
- Check `WSAPME_USER_TOKEN` in `.env` file
- Verify token is valid and not expired
- Ensure token has correct permissions

---

### Issue: "Invalid JSON response"

**Log shows:**
```
[WSAPME API] Failed to parse JSON response
[WSAPME API] Raw response: <html>...</html>
```

**Solution:**
- WSAPME API might be returning HTML error page
- Check endpoint URL is correct
- Verify request format matches WSAPME requirements

---

### Issue: "Status is undefined"

**Log shows:**
```
[WSAPME API] Parsed response data: { success: true, data: {...} }
```

But no `status` field in response.

**Solution:**
- Response structure might be different than expected
- Check the "Raw response" in logs
- Status might be nested differently (e.g., `data.messages.status`)

---

## How to Debug Step by Step

### Step 1: Send Message
```bash
# Watch terminal for:
[DEBUG] Message sent successfully
[DEBUG] Message ID: <id-here>
```

### Step 2: Check Status Immediately
```bash
# Watch terminal for:
========== MESSAGE STATUS CHECK START ==========
[DEBUG] Message ID: <id-here>
[WSAPME API] Calling messageInfo endpoint...
```

### Step 3: Check WSAPME Response
```bash
# Look for:
[WSAPME API] Response status: 200 OK (or error code)
[WSAPME API] Raw response: {...}
```

### Step 4: Verify Status Field
```bash
# Check if status exists in response:
[WSAPME API] Parsed response data: {
  "status": 2,  <-- This should exist
  ...
}
```

---

## What to Share When Reporting Issues

When reporting issues, share:

1. **Terminal logs** from:
   - Message send attempt
   - Status check attempt
   - Any error messages

2. **Browser console logs** (F12 → Console tab)

3. **What you see in UI:**
   - Does send succeed?
   - Does status card appear?
   - What error message (if any)?

4. **Message ID** from successful send (if available)

---

## Testing Status Check Manually

You can test the status endpoint directly:

```bash
# Replace MESSAGE_ID with actual ID from send response
curl -X POST http://localhost:3000/api/test-message-info \
  -H "Content-Type: application/json" \
  -d '{"messageId": "MESSAGE_ID_HERE"}'
```

Or in browser console:
```javascript
fetch('/api/test-message-info', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messageId: 'YOUR_MESSAGE_ID' })
})
.then(r => r.json())
.then(console.log)
```

Check terminal for detailed logs!

---

## Next Steps for Debugging

1. **Try sending a message** and watch terminal
2. **Check what Message ID** is returned
3. **Watch terminal logs** when status is checked
4. **Copy the logs** and check:
   - Is messageId being passed correctly?
   - What does WSAPME API return?
   - Is status field present in response?

---

**Remember:** The terminal is your friend! All detailed debugging info is there.

