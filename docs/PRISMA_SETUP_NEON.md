# Prisma Setup with Neon Postgres

## Overview

Set up Prisma ORM with Neon Postgres for storing blast data and tracking 250-500 recipients daily.

## Prerequisites

- Neon Postgres database URL (connection string)
- Node.js project (already set up)

## Step 1: Install Prisma

```bash
npm install prisma @prisma/client
```

## Step 2: Initialize Prisma

```bash
npx prisma init
```

This creates:
- `prisma/schema.prisma` - Prisma schema file
- `.env` - Environment variables (add Neon connection string here)

## Step 3: Configure Prisma Schema

Update `prisma/schema.prisma`:

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Blast {
  id                Int                @id @default(autoincrement())
  blast_tag         String?            @db.VarChar(255)
  blast_date        DateTime           @default(now()) @db.Timestamp
  blast_time        DateTime?          @db.Time
  follow_up_stage   String?            @db.VarChar(100)
  total_recipients  Int                @default(0)
  created_at        DateTime           @default(now()) @db.Timestamp
  updated_at        DateTime           @default(now()) @updatedAt @db.Timestamp
  
  recipients        BlastRecipient[]
  
  @@index([blast_tag])
  @@index([blast_date])
}

model BlastRecipient {
  id                    Int                @id @default(autoincrement())
  blast_id              Int
  phone_number          String             @db.VarChar(20)
  message_id            String             @unique @db.VarChar(255)
  message_text          String?            @db.Text
  
  // Status tracking
  status                String             @default("PENDING") @db.VarChar(50)
  message_timestamp     BigInt?
  message_c2s_timestamp BigInt?
  read_timestamp        DateTime?          @db.Timestamp
  replied_at            DateTime?          @db.Timestamp
  closed_at             DateTime?          @db.Timestamp
  
  // WSAPME message structure (stored as JSON)
  wsapme_message_data   Json?
  
  created_at            DateTime           @default(now()) @db.Timestamp
  updated_at            DateTime           @default(now()) @updatedAt @db.Timestamp
  
  blast                 Blast              @relation(fields: [blast_id], references: [id], onDelete: Cascade)
  
  @@index([blast_id])
  @@index([message_id])
  @@index([status])
  @@index([phone_number])
  @@map("blast_recipients")
}

model StatusHistory {
  id            Int       @id @default(autoincrement())
  recipient_id  Int
  old_status    String?   @db.VarChar(50)
  new_status    String    @db.VarChar(50)
  changed_at    DateTime  @default(now()) @db.Timestamp
  source        String?   @db.VarChar(50)
  metadata      Json?
  
  recipient     BlastRecipient @relation(fields: [recipient_id], references: [id], onDelete: Cascade)
  
  @@index([recipient_id])
  @@index([changed_at])
  @@map("status_history")
}
```

## Step 4: Configure Neon Database URL

Add to `.env`:

```env
# Neon Postgres connection string
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"
```

**Get connection string from Neon dashboard:**
1. Go to Neon dashboard
2. Select your project
3. Copy connection string
4. Paste to `.env` file

## Step 5: Run Migration

```bash
npx prisma migrate dev --name init
```

This will:
- Create tables in Neon database
- Generate Prisma Client
- Create migration files

## Step 6: Generate Prisma Client

```bash
npx prisma generate
```

## Step 7: Test Connection

Create a test script or use Prisma Studio:

```bash
npx prisma studio
```

Opens Prisma Studio UI to view/edit database.

## Usage in Code

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create blast
const blast = await prisma.blast.create({
  data: {
    blast_tag: 'Product Launch',
    total_recipients: 250,
  }
});

// Add recipient
await prisma.blastRecipient.create({
  data: {
    blast_id: blast.id,
    phone_number: '+601234567890',
    message_id: '3EB0WM0ABC123',
    status: 'PENDING',
  }
});

// Query funnel metrics
const metrics = await prisma.blastRecipient.groupBy({
  by: ['status'],
  where: { blast_id: 1 },
  _count: true,
});
```

## Indexes for Performance

The schema includes indexes on:
- `message_id` - Fast lookup for status checks
- `blast_id` - Fast aggregation by blast
- `status` - Fast filtering by status
- `phone_number` - Fast lookup by phone

## Next Steps

1. Run migrations
2. Create API routes using Prisma Client
3. Implement batch sending with database storage
4. Implement status tracking with database updates

