# WSAPME Webhooks Documentation

## Key Finding: Status Tracking via Webhooks

From [WSAPME API Documentation](https://api.wsapme.com/doc/start.php):

> **Webhooks are calls made to your custom URL when any event gets fired. You can define your own hooks URL at client and account levels. Events notification (webhooks) in real time**
> 
> **Enable status to activate webhook**

This confirms: **Status tracking requires webhooks, not polling via `/api/messageInfo`**

## Webhook Configuration

- Webhooks can be set at **account level** or **device level**
- For testing, use `webhook.site` or `requestb.in`
- **Enable status to activate webhook** - Must enable status notifications

## Webhook Events

The documentation mentions:
- **New messages** (incoming messages)
- **Message delivery events (ack)** - This is what we need for status tracking!

## Webhook Payload Example (Incoming Message)

```json
{
  "type": "text",
  "message": "Hellow World! Testing Wsapme Webhook",
  "file": "",
  "from": "601133428730@c.us",
  "timestamp": 1617690369,
  "is_forwarded": false,
  "is_broadcast": false,
  "dataSender": "",
  "dataReceiver": {
    "jid": "601140464720@s.whatsapp.net",
    "name": "Wsapme Demo",
    "phone": { ... },
    "imgUrl": ""
  }
}
```

**Note:** This example shows incoming messages, not status events (ack). The "ack" events would have a different format showing `DELIVERY_ACK`, `READ_ACK`, etc.

## Status Values in Responses

### Send Message Response
```json
{
  "success": true,
  "message": "Sent successfully",
  "data": {
    "key": { ... },
    "message": { ... },
    "messageTimestamp": "1617700944",
    "status": "SERVER_ACK"  // Initial status after send
  }
}
```

### List Chats Response
Shows messages with status:
```json
{
  "status": "ERROR",  // or other status values
  "messageTimestamp": "1617777273",
  ...
}
```

## What We Need to Do

### 1. Set Up Webhook Endpoint
Create an API route in Next.js to receive webhook notifications:

```
POST /api/webhook/wsapme
```

### 2. Configure Webhook URL in WSAPME
- Set webhook URL at device or account level
- **Enable status** to activate webhook for delivery events

### 3. Handle Status Events
Webhook will send events when message status changes:
- `SERVER_ACK` → Message sent to server
- `DELIVERY_ACK` → Message delivered to recipient
- `READ_ACK` → Message read by recipient

### 4. Store Status Updates
When webhook receives status update:
- Extract messageId from event
- Update status in database (when we add it)
- Track delivery timestamps

## Implementation Plan

1. **Create webhook endpoint** (`/api/webhook/wsapme`)
2. **Test webhook** using webhook.site to see actual event format
3. **Configure webhook URL** in WSAPME dashboard
4. **Enable status notifications** in WSAPME settings
5. **Handle status events** and update tracking

## Conclusion

The `/api/messageInfo` endpoint doesn't work for status polling. **Status tracking must be done via webhooks** as confirmed by the documentation.

The documentation mentions "message delivery events (ack)" which is exactly what we need for tracking `DELIVERY_ACK` and `READ_ACK` statuses.

