# SendMessage v1 vs v2 - Response Comparison

## Endpoints

1. **`/v1/sendMessage`** - Simpler response format
2. **`/v1/sendMessage2`** - Detailed response format (currently used)

## Response Format Comparison

### v1/sendMessage Response

```json
{
  "messageId": "3EB0WM0F3D3F2852B72A9D",
  "id_device": "5850",
  "jid": "60189026292@s.whatsapp.net",
  "message": "Test message via /v1/sendMessage",
  "sendType": "sendMessage",
  "status": "PENDING",
  "disableLinkPreview": 0,
  "qt": 1768715893,
  "priority": 1
}
```

**Characteristics:**
- ✅ Simple, flat structure
- ✅ Includes `messageId` directly
- ✅ Includes `status: "PENDING"`
- ✅ Supports `redirect_url` parameter (for webhooks)
- ❌ No nested `key` structure
- ❌ No full `message` object structure

### v1/sendMessage2 Response

```json
{
  "success": true,
  "message": "Sent Successfully",
  "data": {
    "key": {
      "remoteJid": "60189026292@s.whatsapp.net",
      "fromMe": true,
      "id": "3EB0WM0F161ED1BD7A6532"
    },
    "message": {
      "extendedTextMessage": {
        "text": "This is a test message from Marketing Blast Tracker",
        "contextInfo": {
          "expiration": 0
        }
      },
      "messageContextInfo": {
        "messageSecret": "..."
      }
    },
    "messageTimestamp": "1768716040",
    "status": "PENDING"
  },
  "messageId": "3EB0WM0F161ED1BD7A6532"
}
```

**Characteristics:**
- ✅ Detailed nested structure
- ✅ Includes `key` object with `id`, `remoteJid`, `fromMe`
- ✅ Full `message` object structure
- ✅ `messageTimestamp` included
- ✅ Needed for `/api/messageInfo` queries (requires full structure)
- ❌ Does NOT support `redirect_url` parameter (or doesn't document it)

## Key Differences

| Feature | v1/sendMessage | v1/sendMessage2 |
|---------|---------------|-----------------|
| **Response Structure** | Flat/simple | Nested/detailed |
| **messageId Location** | Direct property | In `data.key.id` and top-level |
| **key Structure** | ❌ Not included | ✅ Included (`key.id`, `key.remoteJid`) |
| **message Structure** | ❌ Not included | ✅ Full structure included |
| **redirect_url Support** | ✅ Supported | ❓ Unknown |
| **For messageInfo** | ❌ Missing required fields | ✅ Has required fields |
| **Webhook via redirect_url** | ✅ Can use `redirect_url` | ❓ Unknown |

## Which One to Use?

### Use v1/sendMessage2 When:
- ✅ You need the full message structure for `/api/messageInfo` queries
- ✅ You want detailed response with `key` and `message` objects
- ✅ Standard sending (currently using this)

### Use v1/sendMessage When:
- ✅ You want to use `redirect_url` parameter for webhooks
- ✅ You need simpler response format
- ✅ You don't need full message structure

## Recommendation

**For Status Tracking:**
- Use **v2** if `/api/messageInfo` works (needs full structure)
- Use **v1** if webhooks via `redirect_url` work (simpler, but might need status from webhook)

**Best Approach:**
- Try **v1 with `redirect_url`** to see if webhooks work
- If webhooks work, v1 might be better for status tracking
- If webhooks don't work, stick with v2 and wait for webhook configuration

## Testing

Both endpoints are now available in the UI:
- "Test Send Message (v2)" - Uses `/v1/sendMessage2`
- "Test Send (v1)" - Uses `/v1/sendMessage` with `redirect_url`

Test both and compare:
1. Response structures
2. Whether webhooks are triggered with v1's `redirect_url`
3. Which one provides better status tracking capabilities

