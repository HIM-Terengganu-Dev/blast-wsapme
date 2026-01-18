# Batch Blast Architecture - 250-500 Recipients Daily

## Overview

Plan for sending marketing blasts to 250-500 recipients daily and tracking each recipient's status through the funnel.

## Key Principle: One MessageId Per Recipient

**Each phone number gets a unique `messageId` from WSAPME.**

When you send 250 messages:
- 250 different `messageId`s (one per recipient)
- Each `messageId` is used to track that specific recipient's status
- Status is tracked per `messageId`, not per phone number

## Architecture

### 1. Blast Creation

```
User creates blast:
  - Enter blast tag (optional)
  - Select date/time
  - Select follow-up stage
  - Upload/enter 250-500 phone numbers
  
Save to database:
  - Create blast record
  - Create 250-500 recipient records (status: PENDING)
```

### 2. Batch Sending

```
For each recipient:
  1. Send message via /v1/sendMessage2
     {
       "device": "5850",
       "to": "+601234567890",
       "message": "Campaign message"
     }
  
  2. Receive response with messageId:
     {
       "messageId": "3EB0WM0ABC123",
       "data": { ... }
     }
  
  3. Store messageId for this recipient:
     UPDATE blast_recipients
     SET message_id = "3EB0WM0ABC123",
         status = "PENDING",
         wsapme_message_data = {...}
     WHERE id = recipient_id
```

**Important:**
- Each recipient gets their own `messageId`
- Store `messageId` immediately after send
- Store full `wsapme_message_data` for reference

### 3. Status Tracking

#### Option A: Polling (Current Method)

```
Every 10 seconds:
  For each recipient with status PENDING/DELIVERY_ACK:
    Call /v1/getMessageStatus:
      {
        "device": "5850",
        "messageId": "3EB0WM0ABC123"  // Unique per recipient
      }
    
    Update database based on response:
      - If status = "DELIVERY_ACK" → Update recipient.status
      - If status = "READ_ACK" → Update recipient.status
```

**Considerations:**
- For 250 recipients: 250 API calls every 10 seconds = 25 calls/second
- Might hit rate limits
- Need batching/throttling

#### Option B: Webhooks (Preferred)

```
Webhook receives status update:
  {
    "messageId": "3EB0WM0ABC123",
    "status": "DELIVERY_ACK",
    "messageC2STimestamp": "..."
  }

  Find recipient by messageId:
    SELECT * FROM blast_recipients WHERE message_id = ?
  
  Update status:
    UPDATE blast_recipients
    SET status = "DELIVERY_ACK",
        message_c2s_timestamp = ...
    WHERE message_id = ?
```

**Better because:**
- No polling needed
- Real-time updates
- Less API calls
- More efficient

### 4. Status Progression

Each recipient progresses independently:

```
Recipient 1 (messageId: ABC123):
  PENDING → DELIVERY_ACK → READ_ACK → REPLIED

Recipient 2 (messageId: DEF456):
  PENDING → DELIVERY_ACK → (stuck here)

Recipient 3 (messageId: GHI789):
  PENDING → DELIVERY_ACK → READ_ACK → (stuck here)
```

**Funnel shows:**
- 250 Sent (all have messageIds)
- 240 Received (status = DELIVERY_ACK)
- 180 Read (status = READ_ACK)
- 50 Replied (status = REPLIED)
- 10 Closed (status = CLOSED)

## Database Schema Highlights

### `blast_recipients` Table

```sql
id | blast_id | phone_number | message_id | status | message_c2s_timestamp | ...
---|----------|--------------|------------|--------|----------------------|---
1  | 1        | +60123456789 | ABC123     | READ_ACK| 1234567890           | ...
2  | 1        | +60123456790 | DEF456     | PENDING | NULL                 | ...
3  | 1        | +60123456791 | GHI789     | DELIVERY_ACK | 1234567891     | ...
```

**Key Points:**
- `message_id` is unique per recipient (one per message sent)
- `message_id` is used to check status via `/v1/getMessageStatus`
- Status is tracked per `message_id`

## API Endpoints Needed

### 1. Create Blast

```
POST /api/blasts
{
  "blast_tag": "Product Launch",
  "recipients": ["+60123456789", "+60123456790", ...],
  "message": "Campaign message",
  "follow_up_stage": "Initial"
}

Response:
{
  "success": true,
  "blast_id": 1,
  "total_recipients": 250
}
```

### 2. Send Blast

```
POST /api/blasts/[id]/send

Sends messages to all recipients:
  - Loops through recipients
  - Sends via /v1/sendMessage2
  - Stores messageId for each
  - Updates status to PENDING

Response:
{
  "success": true,
  "sent": 250,
  "failed": 0
}
```

### 3. Check Status (Background Job)

```
POST /api/blasts/[id]/check-status

Polls /v1/getMessageStatus for all recipients:
  - Gets all messageIds for this blast
  - Checks status for each
  - Updates database

Response:
{
  "checked": 250,
  "updated": 45
}
```

### 4. Get Blast Report

```
GET /api/blasts/[id]/report

Aggregates funnel metrics from database:
  - Sent: COUNT(*)
  - Received: COUNT(*) WHERE status != PENDING
  - Read: COUNT(*) WHERE status IN (READ_ACK, REPLIED, CLOSED)
  - Replied: COUNT(*) WHERE status IN (REPLIED, CLOSED)
  - Closed: COUNT(*) WHERE status = CLOSED

Response:
{
  "sent": 250,
  "received": 240,
  "read": 180,
  "replied": 50,
  "closed": 10
}
```

## Status Tracking Flow

### For Each Recipient:

1. **Send Message**
   - `messageId` = "ABC123" (from WSAPME)
   - Store: `status = "PENDING"`, `message_id = "ABC123"`

2. **Check Status** (polling or webhook)
   - Call `/v1/getMessageStatus` with `messageId = "ABC123"`
   - If status = "DELIVERY_ACK" → Update database
   - If status = "READ_ACK" → Update database

3. **Track Progression**
   - Database shows: `status = "READ_ACK"` for `messageId = "ABC123"`
   - This means recipient at phone number "+60123456789" has read the message

## Rate Limiting Considerations

### Sending 250 Messages:

**Strategy 1: Sequential with Delay**
```
For each recipient:
  Send message
  Wait 1 second
  Send next
```
Time: 250 messages × 1 second = ~4 minutes

**Strategy 2: Batch Parallel**
```
Send 10 messages in parallel
Wait 2 seconds
Repeat
```
Time: 25 batches × 2 seconds = ~50 seconds

**Strategy 3: Rate Limit Aware**
```
Monitor WSAPME rate limits
Send at maximum allowed rate
Queue if limit reached
```

### Status Checking 250 Messages:

**If Polling:**
- Check 250 messageIds every 10 seconds
- That's 25 checks/second
- Might need batching or rate limiting

**If Webhooks:**
- Much better - updates come automatically
- No polling needed
- Real-time status updates

## Next Steps

1. **Set up Neon Postgres connection**
2. **Create database schema** (Prisma)
3. **Build blast management APIs**
4. **Implement batch sending** with messageId storage
5. **Implement status tracking** (polling or webhooks)
6. **Build reporting queries** for funnel metrics

