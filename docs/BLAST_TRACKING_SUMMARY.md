# Blast Tracking Summary - Quick Answers

## Yes, Each Phone Number Gets a Different MessageId

**When you send to 250 recipients:**
- 250 different `messageId`s (one per recipient)
- Example:
  - Recipient 1: `messageId = "3EB0WM0ABC123"`
  - Recipient 2: `messageId = "3EB0WM0DEF456"`
  - Recipient 3: `messageId = "3EB0WM0GHI789"`
  - ... (250 unique messageIds)

**Each `messageId` is used to track that specific recipient's status.**

## Database: PostgreSQL (Neon)

✅ **Using Neon Postgres** - Serverless PostgreSQL

### Tables Needed:

1. **`blasts`** - Each marketing blast campaign
   - `id`, `blast_tag`, `blast_date`, `follow_up_stage`, `total_recipients`

2. **`blast_recipients`** - Each recipient in a blast
   - `id`, `blast_id`, `phone_number`, **`message_id`** (unique per recipient)
   - `status` (PENDING → DELIVERY_ACK → READ_ACK → REPLIED)
   - `message_timestamp`, `message_c2s_timestamp`, `read_timestamp`, `replied_at`
   - `wsapme_message_data` (JSON - full message structure)

## How It Works: 250 Recipients

### 1. Send Blast

```
For each of 250 recipients:
  1. Send via /v1/sendMessage2
  2. Get unique messageId for this recipient
  3. Store in database:
     {
       phone_number: "+60123456789",
       message_id: "3EB0WM0ABC123",  // Unique for this recipient
       status: "PENDING",
       wsapme_message_data: {...}
     }
```

### 2. Track Status (for all 250)

**Each recipient's status is tracked using their unique `messageId`:**

```
For each recipient:
  Call /v1/getMessageStatus with:
    {
      "device": "5850",
      "messageId": "3EB0WM0ABC123"  // Unique per recipient
    }
  
  Update database:
    UPDATE blast_recipients
    SET status = "DELIVERY_ACK",
        message_c2s_timestamp = ...
    WHERE message_id = "3EB0WM0ABC123"
```

### 3. Funnel Report

```sql
SELECT 
  COUNT(*) as sent,                    -- 250
  COUNT(*) FILTER (WHERE status != 'PENDING') as received,  -- 240
  COUNT(*) FILTER (WHERE status IN ('READ_ACK', 'REPLIED')) as read,  -- 180
  COUNT(*) FILTER (WHERE status = 'REPLIED') as replied    -- 50
FROM blast_recipients
WHERE blast_id = 1;
```

**Result:**
- 250 Sent
- 240 Received
- 180 Read
- 50 Replied

## Status Tracking Up to Replied

**Status progression:**
1. **PENDING** - Message sent, awaiting delivery
2. **DELIVERY_ACK** - Message delivered to recipient
3. **READ_ACK** - Message read by recipient
4. **REPLIED** - Recipient replied

**Each recipient progresses independently:**
- Some get stuck at DELIVERY_ACK (message delivered but not read)
- Some get stuck at READ_ACK (message read but not replied)
- Some progress to REPLIED

**Database tracks where each recipient is stuck.**

## Next Steps

1. **Set up Neon Postgres connection**
2. **Create database schema** (see `DATABASE_SCHEMA_PLAN.md`)
3. **Build blast management API**
4. **Implement batch sending** (store messageId per recipient)
5. **Implement status tracking** (poll or webhooks)
6. **Build reporting queries** (funnel aggregation)

## Key Points

✅ Each recipient = 1 unique `messageId`  
✅ Store `messageId` in database for each recipient  
✅ Use `messageId` to check status via `/v1/getMessageStatus`  
✅ Track status progression per recipient  
✅ Funnel shows aggregated counts from database  

See `DATABASE_SCHEMA_PLAN.md` and `BATCH_BLAST_ARCHITECTURE.md` for detailed plans.

