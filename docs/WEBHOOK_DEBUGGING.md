# Webhook Debugging Guide

## Issue: No messageStatus Field in Payload

The user reports that webhook payloads don't contain `messageStatus` or status-related fields.

## What We Know

From WSAPME documentation:
- Webhooks are for "message delivery events (ack)"
- Documentation shows example for incoming messages, but NOT for status/ack events
- Need to **Enable status** to activate webhook for status events

## Possible Reasons

1. **Status Not Enabled**
   - Check WSAPME dashboard → Settings → Webhook
   - Ensure "Enable status" or "Status notifications" is enabled

2. **Different Event Type**
   - Status events might come as separate webhook calls (not in message webhooks)
   - May need to enable different webhook event types

3. **Different Payload Structure**
   - Status might be in nested fields (e.g., `data.status`, `event.status`)
   - Might use different field names (`ack`, `acknowledgment`, `deliveryStatus`)

4. **Webhook Not Receiving Status Events**
   - Only incoming message webhooks are working
   - Status webhooks may need different configuration

## Debugging Steps

### 1. Check All Incoming Webhooks

The webhook endpoint now logs:
- All payload keys
- All payload values
- Status-related fields (checking multiple possible field names)

**Look for fields like:**
- `status`
- `messageStatus`
- `ack`
- `acknowledgment`
- `deliveryStatus`
- `readStatus`
- `messageC2STimestamp`
- `messageId` / `id` / `key.id`

### 2. Test Webhook Configuration

1. **Send a message** via `/api/test-send`
2. **Check terminal logs** for webhook payloads
3. **Look for ANY fields** that might indicate status

### 3. Check WSAPME Settings

- Is "Status" or "Delivery Events" enabled in webhook settings?
- Are there separate webhook URLs for different event types?
- Do status events require a different webhook endpoint?

### 4. Test with webhook.site

1. Get a test webhook URL from webhook.site
2. Configure it in WSAPME
3. Send messages and check what events arrive
4. Look at ALL webhook calls (not just message events)

## What to Log

The webhook endpoint now logs:
```
[WEBHOOK] Raw payload: { ... }
[WEBHOOK] Payload keys: [array of all keys]
[WEBHOOK] Payload values: [array of all values]
[WEBHOOK] Status-related fields found: { ... }
```

This will help identify:
- What fields are actually present
- Where status information might be
- If status events come at all

## Next Steps

1. **Check terminal logs** after sending a message
2. **Share the webhook payload** structure you see
3. **Check WSAPME settings** for status/webhook configuration
4. **Test with webhook.site** to see all incoming events

## Alternative: Check List Chats Endpoint

The `/api/listChats` endpoint shows messages with `status` field in the response. Might need to:
- Poll this endpoint periodically
- Extract status from chat messages
- Not ideal, but might work if webhooks don't provide status

