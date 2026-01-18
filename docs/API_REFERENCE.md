# API Reference

## WSAPME API Integration

### Authentication

All WSAPME API requests require authentication via HTTP header:

```
x-wsapme-token: YOUR_USER_TOKEN
```

---

## Send Message Endpoint

**Endpoint:** `POST https://api.wsapme.com/v1/sendMessage2`

### Request

**Headers:**
```
x-wsapme-token: YOUR_USER_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "device": "5850",
  "to": "60189026292",
  "message": "Your message text here",
  "priority": "1",
  "exclude_group": [12990, 8818]
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `device` | string | Yes | Device ID (currently: "5850") |
| `to` | string | Yes | Phone number (only +60189026292 allowed in this project) |
| `message` | string | Yes | Message text content |
| `priority` | string | No | "1" = high priority, "0" = low priority |
| `exclude_group` | number[] | No | Array of group IDs to exclude from receiving message |

### Response

**Success Example:**
```json
{
  "success": true,
  "messageId": "3EB02BF1E00201A5847E8A",
  "data": {
    // Additional WSAPME response data
  }
}
```

**Error Example:**
```json
{
  "success": false,
  "message": "Unauthorised Token"
}
```

### Usage in Code

```typescript
import { sendMessage } from '@/lib/wsapme';

const result = await sendMessage({
  device: '5850',
  to: '+60189026292',
  message: 'Test message',
});
```

**Note:** The `sendMessage()` function includes safety validation that only allows sending to `+60189026292` or `60189026292`.

---

## Message Info Endpoint

**Endpoint:** `POST https://master.wsapme.com/api/messageInfo`

### Request

**Headers:**
```
x-wsapme-token: YOUR_USER_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "id_device": "5850",
  "jid": "60189026292@s.whatsapp.net",
  "messages": {
    "key": {
      "remoteJid": "60189026292@s.whatsapp.net",
      "fromMe": true,
      "id": "3EB02BF1E00201A5847E8A"
    },
    "status": 2
  }
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id_device` | string | Yes | Device ID (currently: "5850") |
| `jid` | string | Yes | WhatsApp JID format: `{phone}@s.whatsapp.net` |
| `messages.key.id` | string | Yes | Message ID from send response |
| `messages.key.remoteJid` | string | Yes | Same as `jid` |
| `messages.key.fromMe` | boolean | Yes | `true` for sent messages |
| `messages.status` | number | No | Message status code (to be determined) |

### Response

**Example Response:**
```json
{
  "success": true,
  "status": 2,
  "data": {
    // WSAPME message info data
  }
}
```

**Status Codes:** (To be documented after testing)
- `status: 2` - Appears to indicate delivered/read (needs verification)

### Usage in Code

```typescript
import { getMessageInfo, formatPhoneToJid } from '@/lib/wsapme';

const result = await getMessageInfo({
  id_device: '5850',
  jid: formatPhoneToJid('+60189026292'),
  messages: {
    key: {
      remoteJid: formatPhoneToJid('+60189026292'),
      fromMe: true,
      id: 'MESSAGE_ID_FROM_SEND_RESPONSE',
    },
  },
});
```

---

## Internal API Routes (Next.js)

### Mock Test Endpoint (No Device Required)

#### GET /api/test-mock

Mock endpoint that simulates WSAPME API responses. **Can be tested without device being online.**

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | string | `"blast"` | Response type: `"send"`, `"status"`, or `"blast"` |

**Examples:**

1. **Get mock blast data:**
   ```
   GET /api/test-mock?type=blast
   ```

2. **Get mock send response:**
   ```
   GET /api/test-mock?type=send
   ```

3. **Get mock status response:**
   ```
   GET /api/test-mock?type=status
   ```

**Response (type=blast):**
```json
{
  "success": true,
  "data": {
    "sent": 500,
    "received": 480,
    "read": 350,
    "replied": 120,
    "closed": 25
  }
}
```

**Response (type=send):**
```json
{
  "success": true,
  "messageId": "MOCK_1234567890_abc123",
  "data": {
    "messageId": "MOCK_1234567890_abc123",
    "status": "sent",
    "timestamp": 1234567890
  }
}
```

**Response (type=status):**
```json
{
  "success": true,
  "status": 2,
  "data": {
    "messages": {
      "key": {
        "id": "MOCK_MESSAGE_ID",
        "remoteJid": "60189026292@s.whatsapp.net",
        "fromMe": true
      },
      "status": 2,
      "messageTimestamp": 1234567890,
      "pushName": "Test Recipient"
    }
  }
}
```

#### POST /api/test-mock

Mock POST endpoint for testing without device.

**Request Body:**
```json
{
  "type": "send" | "status",
  "messageId": "optional for status type"
}
```

**Usage:**
```javascript
// Mock send
fetch('/api/test-mock', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'send' })
})

// Mock status check
fetch('/api/test-mock', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'status', messageId: 'MOCK_ID' })
})
```

---

### GET /api/blast-data

Returns aggregated blast metrics for funnel chart. **Does not require device to be online** (currently returns mock data).

**Response:**
```json
{
  "success": true,
  "data": {
    "sent": 500,
    "received": 480,
    "read": 350,
    "replied": 120,
    "closed": 25
  }
}
```

**Status:** Currently returns mock data. Needs integration with WSAPME messageInfo queries.

---

### POST /api/test-send

Test endpoint to send a WhatsApp message via WSAPME API. **Requires device to be online.**

**Request Body:**
```json
{
  "message": "Your test message here" // optional, defaults to test message
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* WSAPME send response */ },
  "messageId": "3EB02BF1E00201A5847E8A"
}
```

**Note:** Only sends to `+60189026292` due to safety validation.

**Usage:**
```javascript
fetch('/api/test-send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Test message' })
})
```

---

### POST /api/test-message-info

Test endpoint to get message status/info from WSAPME API. **Requires device to be online.**

**Request Body:**
```json
{
  "messageId": "3EB02BF1E00201A5847E8A",
  "jid": "60189026292@s.whatsapp.net" // optional, auto-formatted if not provided
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* WSAPME message info response */ },
  "status": 2
}
```

**Usage:**
```javascript
fetch('/api/test-message-info', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messageId: 'MESSAGE_ID' })
})
```

---

## Error Handling

### Common Error Responses

**Authentication Error:**
```json
{
  "success": false,
  "message": "Unauthorised Token"
}
```

**Validation Error:**
```json
{
  "success": false,
  "error": "Safety check failed: Phone number must be +60189026292 or 60189026292"
}
```

**Missing Parameters:**
```json
{
  "success": false,
  "error": "messageId is required"
}
```

### Error Handling in Code

All WSAPME client functions throw errors that should be caught:

```typescript
try {
  const result = await sendMessage({ /* ... */ });
} catch (error) {
  console.error('Failed to send message:', error);
  // Handle error
}
```

---

## Rate Limiting

Currently not implemented, but WSAPME API may have rate limits. Consider implementing:
- Request throttling
- Exponential backoff on errors
- Rate limit tracking

---

## Testing Checklist

When device comes online, test and document:

- [ ] Send message endpoint with various message lengths
- [ ] Message info endpoint with different message IDs
- [ ] Status code meanings (0, 1, 2, 3, etc.)
- [ ] Error scenarios (invalid token, offline device, etc.)
- [ ] Response time and performance
- [ ] Rate limiting behavior
- [ ] Bulk message status queries (if supported)

---

## Summary: Which Endpoints Require Device?

| Endpoint | Device Required? | Purpose |
|----------|------------------|---------|
| `GET /api/blast-data` | ❌ No | Get blast metrics (mock data) |
| `GET /api/test-mock` | ❌ No | Mock test responses |
| `POST /api/test-mock` | ❌ No | Mock POST responses |
| `POST /api/test-send` | ✅ Yes | Send real WhatsApp message |
| `POST /api/test-message-info` | ✅ Yes | Get real message status |

---

**Note:** This API reference will be updated as testing progresses and more details are discovered about the WSAPME API responses and status codes.

