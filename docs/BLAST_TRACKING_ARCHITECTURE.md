# Blast Tracking Architecture

## Overview

For production use, we need to track marketing blasts to 250+ recipients and monitor each recipient's progress through the funnel: Sent → Received → Read → Replied → Closed.

## Current Limitations

1. **No Database** - Currently all data is ephemeral (lost on server restart)
2. **Single Message Tracking** - Only tracking one test message at a time
3. **No Recipient Management** - Can't track multiple recipients per blast
4. **Status Check Issues** - `/api/messageInfo` not returning status data yet

## Required Architecture

### Database Schema (PostgreSQL with Prisma)

```prisma
model Blast {
  id            String   @id @default(uuid())
  message       String
  blastTag      String?  // Optional tag for filtering
  scheduledAt   DateTime?
  createdAt     DateTime @default(now())
  status        String   @default("pending") // pending, sending, completed, failed
  
  recipients    BlastRecipient[]
  reports       BlastReport[]
}

model BlastRecipient {
  id            String   @id @default(uuid())
  blastId       String
  phoneNumber   String
  name          String?
  
  // Status tracking
  status        String   @default("pending") // pending, sent, delivered, read, replied, closed
  messageId     String?  // From WSAPME send response
  
  // Timestamps
  sentAt        DateTime?
  deliveredAt   DateTime?
  readAt        DateTime?
  repliedAt     DateTime?
  closedAt      DateTime?
  
  // Exact message structure from send response (for status checks)
  messageData   Json?    // Store exact structure for messageInfo queries
  
  // Funnel stage tracking
  stuckAtStage  String?  // Which stage they're stuck at (if not closed)
  
  blast         Blast    @relation(fields: [blastId], references: [id])
  
  @@index([blastId])
  @@index([status])
  @@index([phoneNumber])
}

model BlastReport {
  id            String   @id @default(uuid())
  blastId       String
  totalSent     Int      @default(0)
  totalDelivered Int     @default(0)
  totalRead     Int      @default(0)
  totalReplied  Int      @default(0)
  totalClosed   Int      @default(0)
  calculatedAt  DateTime @default(now())
  
  blast         Blast    @relation(fields: [blastId], references: [id])
}
```

## Data Flow for 250 Recipients

### Step 1: Create Blast
```typescript
POST /api/blasts
{
  "message": "Marketing message",
  "recipients": ["60123456789", "60123456790", ...], // 250 numbers
  "blastTag": "campaign-2025-01"
}
```

### Step 2: Send Messages (Batch)
```typescript
// For each recipient:
1. Send message via WSAPME API
2. Store messageId and EXACT message structure in database
3. Update BlastRecipient.status = "sent"
4. Store exact messageData JSON for later status checks
```

### Step 3: Track Status (Polling/Webhooks)
```typescript
// Option A: Polling (if messageInfo works)
- Query status for each messageId
- Update BlastRecipient status and timestamps
- Track which stage each recipient is at

// Option B: Webhooks (preferred)
- WSAPME sends webhook when status changes
- Update BlastRecipient in database
- Real-time status updates
```

### Step 4: Aggregate Funnel Metrics
```typescript
GET /api/blasts/{id}/report
- Count recipients by status
- Calculate funnel metrics
- Show which stage recipients are stuck at
```

## Implementation Plan

### Phase 1: Database Setup
- [ ] Install Prisma
- [ ] Create schema (Blast, BlastRecipient, BlastReport)
- [ ] Run migrations
- [ ] Seed test data

### Phase 2: Blast Creation
- [ ] API endpoint to create blast with multiple recipients
- [ ] Store exact message structure when sending
- [ ] Batch send messages (with rate limiting)

### Phase 3: Status Tracking
- [ ] Store exact message structure in database
- [ ] Implement status polling for all recipients
- [ ] Or set up webhook endpoint for status updates
- [ ] Update recipient status in database

### Phase 4: Funnel Aggregation
- [ ] Query database for recipient statuses
- [ ] Calculate funnel metrics per blast
- [ ] Show stuck recipients by stage
- [ ] Generate reports

## Exact Message Structure Storage

When sending a message, we need to store the EXACT response structure:

```typescript
// After sending, store:
{
  messageId: "3EB0WM0E94B006251576F7",
  exactStructure: {
    key: { ... },
    message: { ... },
    messageTimestamp: "...",
    status: "PENDING",
    // ... everything from send response
  }
}
```

This exact structure is needed for `/api/messageInfo` queries later.

## Funnel Tracking Per Recipient

For each recipient, track:
- **Sent**: messageId exists, sentAt timestamp set
- **Delivered**: status = "DELIVERY_ACK" or messageC2STimestamp exists
- **Read**: status = "READ_ACK" 
- **Replied**: Detected via webhook or manual update
- **Closed**: Manual update when sale is closed

**Stuck At Stage**: Track the last stage reached before closing (if not closed)

## Example: 250 Recipients Blast

```
Blast ID: abc-123
Total Recipients: 250

Funnel Breakdown:
- Sent: 250 (100%)
- Delivered: 240 (96%) - 10 stuck here
- Read: 180 (72%) - 60 stuck here  
- Replied: 80 (32%) - 100 stuck here
- Closed: 25 (10%) - 55 stuck here

Stuck Recipients:
- 10 at "sent" (not delivered)
- 60 at "delivered" (not read)
- 100 at "read" (not replied)
- 55 at "replied" (not closed)
```

## Next Steps

1. **Set up database** (PostgreSQL + Prisma)
2. **Store exact message structure** when sending
3. **Implement batch sending** for multiple recipients
4. **Set up status tracking** (polling or webhooks)
5. **Build aggregation queries** for funnel metrics

