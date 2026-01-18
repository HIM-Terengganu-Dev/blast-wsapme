# Production Blast Tracking - 250 Recipients

## Requirements

Track marketing blasts to 250+ recipients and monitor:
- How many survive each funnel stage
- Which stage recipients get stuck at
- Aggregate metrics per blast

## Solution Architecture

### 1. Database Storage (Required)

We need PostgreSQL + Prisma to store:
- **Blast** records (campaign info)
- **BlastRecipient** records (one per recipient, with status tracking)
- **BlastReport** records (aggregated metrics)

### 2. Exact Message Structure Storage

**When sending:**
```typescript
// After WSAPME send response, store:
{
  messageId: "3EB0WM0E94B006251576F7",
  exactMessageStructure: {
    // EXACT response from sendMessage API
    key: { ... },
    message: { ... },
    messageTimestamp: "...",
    status: "PENDING",
    // ... everything
  }
}
```

**Why:** The `/api/messageInfo` endpoint needs this exact structure to check status.

### 3. Blast Flow

```
1. Create Blast
   POST /api/blasts
   {
     "message": "Marketing message",
     "recipients": ["60123456789", "60123456790", ...], // 250 numbers
     "blastTag": "campaign-2025-01"
   }

2. Send Messages (Batch)
   - For each recipient:
     a. Send via WSAPME API
     b. Store messageId + exact structure in database
     c. Update status = "sent"

3. Track Status (Polling/Webhooks)
   - Query status for each messageId using exact structure
   - Update recipient status: delivered, read, replied
   - Track which stage each recipient is at

4. Manual Updates
   - Mark as "replied" when recipient responds
   - Mark as "closed" when sale is completed

5. Generate Report
   GET /api/blasts/{id}/report
   - Aggregate all recipients by status
   - Show funnel breakdown
   - List recipients stuck at each stage
```

## Funnel Stages Tracking

For each recipient, track progression:

| Stage | Status Value | How Detected |
|-------|-------------|--------------|
| **Sent** | `sent` | messageId exists, sentAt timestamp |
| **Received** | `delivered` | status = "DELIVERY_ACK" or messageC2STimestamp exists |
| **Read** | `read` | status = "READ_ACK" |
| **Replied** | `replied` | Manual update or webhook |
| **Closed** | `closed` | Manual update when sale closed |

**Stuck At Stage:** Track the last stage reached (if not closed)

## Example: 250 Recipients Blast Report

```
Blast: Campaign 2025-01-18
Total Recipients: 250

Funnel Metrics:
┌─────────────┬────────┬──────────┬─────────────┐
│ Stage       │ Count  │ % of Sent│ Stuck Here  │
├─────────────┼────────┼──────────┼─────────────┤
│ Sent        │ 250    │ 100%     │ 0           │
│ Received    │ 240    │ 96%      │ 10          │
│ Read        │ 180    │ 72%      │ 60          │
│ Replied     │ 80     │ 32%      │ 100         │
│ Closed      │ 25     │ 10%      │ 0           │
└─────────────┴────────┴──────────┴─────────────┘

Stuck Recipients Breakdown:
- 10 recipients stuck at "sent" (not delivered)
- 60 recipients stuck at "delivered" (not read)
- 100 recipients stuck at "read" (not replied)
- 55 recipients stuck at "replied" (not closed)
```

## Implementation Steps

### Step 1: Database Setup
```bash
npm install prisma @prisma/client
npx prisma init
# Create schema with Blast, BlastRecipient, BlastReport models
npx prisma migrate dev
```

### Step 2: Store Exact Message Structure
- Already implemented: Logging exact structure when sending
- Next: Store in database when creating BlastRecipient record

### Step 3: Batch Sending
- Create API endpoint to send to multiple recipients
- Store each messageId + exact structure
- Handle rate limiting (don't send all 250 at once)

### Step 4: Status Tracking
- Poll status for all recipients (or use webhooks)
- Update database with status changes
- Track timestamps for each stage

### Step 5: Funnel Aggregation
- Query database to count recipients by status
- Calculate percentages
- Show stuck recipients per stage

## Current Status

✅ **Working:**
- Message sending
- Exact message structure logging
- Device info retrieval

⏳ **Pending:**
- Database setup
- Batch sending
- Status tracking (waiting for messageInfo to work)
- Funnel aggregation

## Next Actions

1. **Set up database** (PostgreSQL + Prisma)
2. **Create blast management API** (create, list, get report)
3. **Implement batch sending** with exact structure storage
4. **Set up status tracking** (polling or webhooks)
5. **Build funnel aggregation** queries

