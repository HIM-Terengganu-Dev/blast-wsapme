# Database Schema Plan - Marketing Blast Tracker

## Overview

Track marketing blasts to 250-500 recipients daily, with status tracking from sent → received → read → replied.

Each message sent will have a unique `messageId` from WSAPME API.

## Database: Neon Postgres

Using Neon Postgres (serverless PostgreSQL).

## Schema Design

### 1. `blasts` Table

Stores each marketing blast campaign.

```sql
CREATE TABLE blasts (
  id SERIAL PRIMARY KEY,
  blast_tag VARCHAR(255),              -- Optional tag/identifier for the blast
  blast_date TIMESTAMP DEFAULT NOW(),  -- When blast was sent
  blast_time TIME,                     -- Specific time if needed
  follow_up_stage VARCHAR(100),        -- Follow-up stage (e.g., "Initial", "Follow-up 1", etc.)
  total_recipients INTEGER DEFAULT 0,  -- Total recipients in this blast
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Fields:**
- `id` - Unique blast ID
- `blast_tag` - Tag for filtering (e.g., "Product Launch", "Promo Campaign")
- `blast_date` / `blast_time` - When sent
- `follow_up_stage` - Stage in follow-up sequence
- `total_recipients` - Count of recipients

### 2. `blast_recipients` Table

Stores each recipient in a blast, with their message status.

```sql
CREATE TABLE blast_recipients (
  id SERIAL PRIMARY KEY,
  blast_id INTEGER REFERENCES blasts(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,     -- Recipient phone number (e.g., "+601234567890")
  message_id VARCHAR(255) NOT NULL,      -- Unique messageId from WSAPME API
  message_text TEXT,                     -- Message content sent
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'PENDING',  -- PENDING, SERVER_ACK, DELIVERY_ACK, READ_ACK, REPLIED, CLOSED
  message_timestamp BIGINT,              -- Original message timestamp from WSAPME
  message_c2s_timestamp BIGINT,          -- Delivery timestamp (when received)
  read_timestamp TIMESTAMP,              -- When message was read
  replied_at TIMESTAMP,                  -- When recipient replied
  closed_at TIMESTAMP,                   -- When sale was closed
  
  -- WSAPME message structure (for status checks)
  wsapme_message_data JSONB,             -- Full message structure from send response
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(blast_id, phone_number, message_id),  -- One message per recipient per blast
  INDEX idx_message_id (message_id),           -- Fast lookup by messageId
  INDEX idx_blast_id (blast_id),               -- Fast lookup by blast
  INDEX idx_status (status),                   -- Filter by status
  INDEX idx_phone (phone_number)               -- Filter by phone
);
```

**Fields:**
- `message_id` - **Unique ID from WSAPME** (this is what we use to check status)
- `status` - Current status: `PENDING` → `DELIVERY_ACK` → `READ_ACK` → `REPLIED` → `CLOSED`
- `wsapme_message_data` - Store full message structure for status checks
- Timestamps for tracking progression

### 3. `status_history` Table (Optional)

Track status changes over time for debugging/auditing.

```sql
CREATE TABLE status_history (
  id SERIAL PRIMARY KEY,
  recipient_id INTEGER REFERENCES blast_recipients(id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_at TIMESTAMP DEFAULT NOW(),
  source VARCHAR(50),                    -- 'webhook', 'polling', 'manual'
  metadata JSONB                         -- Additional data from status update
);
```

**Purpose:**
- Audit trail of status changes
- Debug status tracking issues
- See timing of status updates

## Data Flow

### 1. Send Blast (250-500 recipients)

```
For each recipient:
  1. Send message via /v1/sendMessage2
  2. Get messageId from response
  3. Store in blast_recipients:
     - blast_id
     - phone_number
     - message_id (unique per recipient)
     - message_text
     - status: "PENDING"
     - wsapme_message_data (full response)
```

### 2. Status Tracking

**Option A: Polling (Current)**
```
Every 5-10 seconds:
  For each PENDING/DELIVERY_ACK message:
    Call /v1/getMessageStatus with messageId
    Update blast_recipients.status
```

**Option B: Webhooks (Preferred)**
```
Webhook receives status update:
  1. Extract messageId from webhook payload
  2. Find recipient by messageId
  3. Update blast_recipients.status
  4. Log to status_history
```

### 3. Status Updates

```sql
-- Update status when delivered
UPDATE blast_recipients 
SET status = 'DELIVERY_ACK', 
    message_c2s_timestamp = EXTRACT(EPOCH FROM NOW())
WHERE message_id = ?;

-- Update status when read
UPDATE blast_recipients 
SET status = 'READ_ACK', 
    read_timestamp = NOW()
WHERE message_id = ?;

-- Mark as replied
UPDATE blast_recipients 
SET status = 'REPLIED', 
    replied_at = NOW()
WHERE message_id = ?;
```

## Funnel Aggregation Queries

### Get Blast Metrics

```sql
SELECT 
  b.id as blast_id,
  b.blast_tag,
  b.blast_date,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE br.status != 'PENDING') as received,
  COUNT(*) FILTER (WHERE br.status IN ('READ_ACK', 'REPLIED', 'CLOSED')) as read,
  COUNT(*) FILTER (WHERE br.status IN ('REPLIED', 'CLOSED')) as replied,
  COUNT(*) FILTER (WHERE br.status = 'CLOSED') as closed
FROM blasts b
LEFT JOIN blast_recipients br ON b.id = br.blast_id
WHERE b.id = ?
GROUP BY b.id, b.blast_tag, b.blast_date;
```

### Get Recipients Stuck at Each Stage

```sql
SELECT 
  status,
  COUNT(*) as count,
  COUNT(*) * 100.0 / (SELECT COUNT(*) FROM blast_recipients WHERE blast_id = ?) as percentage
FROM blast_recipients
WHERE blast_id = ?
GROUP BY status
ORDER BY 
  CASE status
    WHEN 'PENDING' THEN 1
    WHEN 'DELIVERY_ACK' THEN 2
    WHEN 'READ_ACK' THEN 3
    WHEN 'REPLIED' THEN 4
    WHEN 'CLOSED' THEN 5
  END;
```

## Implementation Plan

### Phase 1: Database Setup
1. Create tables in Neon Postgres
2. Set up Prisma schema
3. Migrations

### Phase 2: Batch Sending
1. Create `/api/blasts` endpoint to create blast
2. Create `/api/blasts/[id]/send` to send to all recipients
3. Store each messageId per recipient
4. Handle rate limiting (250-500 messages)

### Phase 3: Status Tracking
1. Poll `/v1/getMessageStatus` for all messageIds
2. Or set up webhooks to update status
3. Update database when status changes

### Phase 4: Reporting
1. Query database for funnel metrics
2. Display in funnel chart
3. Filter by date, tag, status, etc.

## Key Considerations

1. **Rate Limiting**
   - 250-500 messages need to be sent over time
   - WSAPME might have rate limits
   - Send in batches with delays

2. **Message ID Uniqueness**
   - Each `messageId` is unique per message
   - One messageId per recipient
   - Use `messageId` as key for status lookups

3. **Status Updates**
   - Poll all messageIds periodically (e.g., every 10 seconds)
   - Or use webhooks if available
   - Update database with latest status

4. **Performance**
   - Index on `message_id` for fast lookups
   - Index on `blast_id` for aggregations
   - Consider pagination for large blasts

5. **Error Handling**
   - Handle failed sends
   - Retry logic for failed status checks
   - Log errors for debugging

## Next Steps

1. Set up Prisma with Neon Postgres
2. Create database schema
3. Build API endpoints for blast management
4. Implement batch sending with status tracking
5. Build reporting queries

