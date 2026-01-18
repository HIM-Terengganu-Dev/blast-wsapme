# Implementation Roadmap - Batch Blast Tracking

## Current Status

✅ **Working:**
- Single message sending (`/v1/sendMessage2`)
- Single message status checking (`/v1/getMessageStatus`)
- Test endpoints working
- UI displays funnel chart (with mock data)

⏳ **Next Steps:**
- Database integration (Neon Postgres + Prisma)
- Batch sending (250-500 recipients)
- Status tracking for multiple recipients
- Real funnel aggregation from database

## Phase 1: Database Setup

### 1.1 Install Dependencies
```bash
npm install prisma @prisma/client
```

### 1.2 Initialize Prisma
```bash
npx prisma init
```

### 1.3 Configure Schema
- Create `prisma/schema.prisma` with tables:
  - `Blast` - Marketing blast campaigns
  - `BlastRecipient` - Recipients with messageIds
  - `StatusHistory` - Audit trail (optional)

### 1.4 Set Up Neon Connection
- Add `DATABASE_URL` to `.env`
- Get connection string from Neon dashboard

### 1.5 Run Migrations
```bash
npx prisma migrate dev --name init
```

**Deliverable:** Database tables created and accessible via Prisma Client

---

## Phase 2: Blast Management API

### 2.1 Create Blast Endpoint
```
POST /api/blasts
{
  "blast_tag": "Product Launch",
  "recipients": ["+60123456789", ...],
  "message": "Campaign message",
  "follow_up_stage": "Initial"
}

- Create blast record
- Create recipient records (status: PENDING)
- Return blast_id
```

### 2.2 List Blasts Endpoint
```
GET /api/blasts
- List all blasts
- Include aggregated metrics (sent, received, read, replied)
```

### 2.3 Get Blast Details
```
GET /api/blasts/[id]
- Blast details
- List of recipients with statuses
```

**Deliverable:** API to create and manage blasts

---

## Phase 3: Batch Sending

### 3.1 Send Blast Endpoint
```
POST /api/blasts/[id]/send
- Loop through recipients
- Send message via /v1/sendMessage2 for each
- Store messageId for each recipient
- Update status to PENDING
- Handle rate limiting (send in batches)
```

### 3.2 Store Message Data
```
For each recipient:
  - Store messageId (unique per recipient)
  - Store full wsapme_message_data (JSON)
  - Set status = "PENDING"
  - Record timestamp
```

**Deliverable:** Can send to 250-500 recipients and store messageIds

---

## Phase 4: Status Tracking

### 4.1 Polling Implementation
```
Background job or API endpoint:
  POST /api/blasts/[id]/check-status
  
  - Get all messageIds for this blast
  - For each messageId:
    - Call /v1/getMessageStatus
    - Update database if status changed
  - Handle rate limiting (batch requests)
```

### 4.2 Webhook Integration (Alternative)
```
Update /api/webhook/wsapme:
  - Extract messageId from webhook payload
  - Find recipient by messageId
  - Update status in database
  - Log to status_history
```

### 4.3 Status Update Logic
```
When status changes:
  1. Update blast_recipients.status
  2. Update relevant timestamps
  3. Log to status_history (optional)
  4. Trigger real-time update if needed
```

**Deliverable:** Status tracking for all recipients in a blast

---

## Phase 5: Funnel Reporting

### 5.1 Blast Metrics Endpoint
```
GET /api/blasts/[id]/metrics

Query database:
  - COUNT(*) WHERE status != null → sent
  - COUNT(*) WHERE status != 'PENDING' → received
  - COUNT(*) WHERE status IN ('READ_ACK', 'REPLIED', 'CLOSED') → read
  - COUNT(*) WHERE status IN ('REPLIED', 'CLOSED') → replied
  - COUNT(*) WHERE status = 'CLOSED' → closed

Return:
{
  "sent": 250,
  "received": 240,
  "read": 180,
  "replied": 50,
  "closed": 10
}
```

### 5.2 Stuck Recipients Query
```
GET /api/blasts/[id]/stuck-recipients

Group by status, show where recipients are stuck:
  - 10 stuck at PENDING
  - 60 stuck at DELIVERY_ACK
  - 100 stuck at READ_ACK
  - etc.
```

### 5.3 Update Funnel Chart
```
Replace mock data with real database queries:
  - Fetch metrics from /api/blasts/[id]/metrics
  - Display in FunnelChart component
  - Show real-time updates
```

**Deliverable:** Real funnel metrics from database

---

## Phase 6: Filtering & Reporting

### 6.1 Filter by Date/Time
```
GET /api/blasts?date=2025-01-18
GET /api/blasts?date_from=2025-01-01&date_to=2025-01-31
```

### 6.2 Filter by Blast Tag
```
GET /api/blasts?tag=Product+Launch
```

### 6.3 Filter by Follow-up Stage
```
GET /api/blasts?stage=Initial
```

### 6.4 Filter by Status
```
GET /api/blasts/[id]/recipients?status=READ_ACK
```

**Deliverable:** Filtering capabilities as specified

---

## Summary

1. ✅ **Database Setup** - Prisma + Neon Postgres
2. ✅ **Blast Management** - Create, list, view blasts
3. ✅ **Batch Sending** - Send to 250-500 recipients, store messageIds
4. ✅ **Status Tracking** - Poll or webhook to update status
5. ✅ **Funnel Reporting** - Query database for metrics
6. ✅ **Filtering** - Filter by date, tag, stage, status

Each phase builds on the previous one. Start with Phase 1 (database setup) and proceed sequentially.

