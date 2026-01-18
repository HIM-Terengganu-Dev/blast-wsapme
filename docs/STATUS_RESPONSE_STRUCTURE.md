# Status Response Structure

## Example Status Response (from `/v1/sendMessage2` or related endpoint)

```json
{
  "key": {
    "remoteJid": "601234567890@s.whatsapp.net",
    "fromMe": true,
    "id": "WMAPI01D888T1634061784"
  },
  "message": {
    "conversation": "Testing 123"
  },
  "messageTimestamp": "1634061784",
  "status": "DELIVERY_ACK",
  "messageC2STimestamp": "1634061785"
}
```

## Key Fields

| Field | Description | Usage |
|-------|-------------|-------|
| `key.id` | Message ID | Track which message this status belongs to |
| `key.remoteJid` | Recipient's WhatsApp JID | Identify recipient |
| `status` | Status code | `"SERVER_ACK"` = sent to server<br>`"DELIVERY_ACK"` = delivered to recipient<br>`"READ_ACK"` = read by recipient |
| `messageC2STimestamp` | Client-to-server timestamp | When message was delivered/received |
| `messageTimestamp` | Message timestamp | When message was originally sent |

## Status Values

- `"SERVER_ACK"` - Message sent to server (initial response)
- `"DELIVERY_ACK"` - Message delivered to recipient ✅
- `"READ_ACK"` - Message read by recipient ✅

## Questions to Resolve

1. **Where does this response come from?**
   - Webhook after sending?
   - Polling endpoint?
   - Response from `/v1/sendMessage2` after some time?

2. **How do we get this status?**
   - Wait for webhook?
   - Poll an endpoint with messageId?
   - Call `/v1/sendMessage2` again?

3. **Timing:**
   - When is this status available?
   - How long after sending?

## Implementation Notes

When we receive this structure:
- Extract `status` field to determine delivery/read status
- Use `messageC2STimestamp` to track delivery time
- Match `key.id` to original messageId to update recipient status
- Update funnel tracking: delivered (DELIVERY_ACK), read (READ_ACK)

