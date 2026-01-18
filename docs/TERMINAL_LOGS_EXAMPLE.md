# Terminal Logs Example for WSAPME Developer

## Sample Terminal Output

These are example logs from our testing. Actual logs will show timestamps and full request/response data.

---

## Example: Send Message (Working)

```
[2025-01-18T04:05:02.884Z] ========== SEND MESSAGE START ==========
[DEBUG] Request body: { "message": "Test message" }
[WSAPME API] Calling sendMessage endpoint: https://api.wsapme.com/v1/sendMessage2
[WSAPME API] Request payload: {
  "device": "5850",
  "to": "+60189026292",
  "message": "Test message"
}
[WSAPME API] Response status: 200 OK
[WSAPME API] Raw response: {"success":true,"message":"Sent Successfully","data":{"key":{"remoteJid":"60189026292@s.whatsapp.net","fromMe":true,"id":"3EB0WM0E1CBF027CFB3649"},"message":{"extendedTextMessage":{"text":"Test message","contextInfo":{"expiration":0}},"messageContextInfo":{"messageSecret":"..."}},"messageTimestamp":"1768716040","status":"PENDING"}}
[WSAPME API] Extracted messageId: 3EB0WM0E1CBF027CFB3649
```

**Result:** ✅ Success - Message sent, messageId extracted

---

## Example: Check Message Status (Empty Response)

```
[2025-01-18T04:05:02.884Z] ========== MESSAGE STATUS CHECK START ==========
[DEBUG] Received request body: {
  "messageId": "3EB0WM0E1CBF027CFB3649",
  "messageData": { ... }
}
[DEBUG] Using JID: 60189026292@s.whatsapp.net
[DEBUG] Message ID: 3EB0WM0E1CBF027CFB3649
[DEBUG] Request payload to WSAPME: {
  "id_device": "5850",
  "jid": "60189026292@s.whatsapp.net",
  "messages": {
    "key": {
      "remoteJid": "60189026292@s.whatsapp.net",
      "fromMe": true,
      "id": "3EB0WM0E1CBF027CFB3649"
    },
    "messageTimestamp": 1768716040,
    "pushName": "User",
    "broadcast": false,
    "status": 2,
    "message": { ... }
  }
}
[WSAPME API] Calling messageInfo endpoint: https://api.wsapme.com/api/messageInfo
[WSAPME API] Request payload: { ... }
[WSAPME API] Response status: 200 OK
[WSAPME API] Response headers: {
  'content-type': 'application/json; charset=utf-8',
  'status': 200,
  ...
}
[WSAPME API] Raw response: {"success":false,"message":"messageInfo ","data":{}}
[WSAPME API] Parsed response data: {
  "success": false,
  "message": "messageInfo ",
  "data": {}
}
```

**Result:** ❌ Empty data - No status information returned

---

## Full Request/Response Details

### Request
```http
POST https://api.wsapme.com/api/messageInfo
Headers:
  x-wsapme-token: 8fe84f4bf9f729d70a731f724d540b51
  Content-Type: application/json

Body:
{
  "id_device": "5850",
  "jid": "60189026292@s.whatsapp.net",
  "messages": {
    "key": {
      "remoteJid": "60189026292@s.whatsapp.net",
      "fromMe": true,
      "id": "3EB0WM0E1CBF027CFB3649"
    },
    "messageTimestamp": 1768716040,
    "pushName": "User",
    "broadcast": false,
    "status": 2,
    "message": {
      "extendedTextMessage": {
        "text": "Test message",
        "contextInfo": { "expiration": 0 }
      },
      "messageContextInfo": {
        "messageSecret": "..."
      }
    }
  }
}
```

### Response
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
  "success": false,
  "message": "messageInfo ",
  "data": {}
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "status": "DELIVERY_ACK",
    "messageC2STimestamp": "1634061785",
    ...
  }
}
```

---

## How to Generate Fresh Logs

To get fresh terminal logs for WSAPME developer:

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Send a test message** via UI or API

3. **Check message status** via UI or API

4. **Copy terminal output** showing:
   - Request payloads
   - Response status codes
   - Raw responses
   - Any error messages

5. **Share logs** from the terminal where `npm run dev` is running

The terminal will show all `[WSAPME API]` and `[DEBUG]` logs with full request/response details.

