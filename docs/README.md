# Marketing Blast Tracker - Documentation

## Project Overview

A Next.js full-stack application to track and report on WhatsApp marketing message blasts via WSAPME API. The application displays metrics in a left-to-right funnel chart showing the progression from Sent → Received → Read → Replied → Closed.

## Table of Contents

1. [Project Setup](#project-setup)
2. [Project Structure](#project-structure)
3. [Configuration](#configuration)
4. [WSAPME API Integration](#wsapme-api-integration)
5. [API Endpoints](#api-endpoints)
6. [Components](#components)
7. [Testing](#testing)
8. [Future Enhancements](#future-enhancements)

---

## Project Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- WSAPME account with User Token

### Installation

1. Clone/navigate to the project directory
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` file in the root directory:
   ```env
   WSAPME_USER_TOKEN=your_wsapme_user_token_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

---

## Project Structure

```
marketing-blast-tracker/
├── app/
│   ├── api/
│   │   ├── blast-data/          # Main API for blast metrics
│   │   │   └── route.ts
│   │   ├── test-send/            # Test endpoint for sending messages
│   │   │   └── route.ts
│   │   ├── test-message-info/    # Test endpoint for message status
│   │   │   └── route.ts
│   │   └── test-mock/            # Mock endpoint (no device required)
│   │       └── route.ts
│   ├── globals.css               # Global CSS with Tailwind imports
│   ├── layout.tsx                # Root layout component
│   └── page.tsx                  # Main dashboard page
├── components/
│   └── FunnelChart.tsx           # Funnel chart visualization component
├── lib/
│   └── wsapme.ts                 # WSAPME API client functions
├── types/
│   └── index.ts                  # TypeScript type definitions
├── docs/                         # Documentation (this folder)
├── .env                          # Environment variables (not in git)
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── tsconfig.json
```

---

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `WSAPME_USER_TOKEN` | WSAPME API authentication token | Yes |

### Tailwind CSS v4

This project uses Tailwind CSS v4, which requires:
- `@tailwindcss/postcss` plugin in `postcss.config.js`
- `@import "tailwindcss";` syntax in CSS files
- Content paths configured in `tailwind.config.js`

### TypeScript

TypeScript configuration uses path aliases:
- `@/*` maps to the project root

---

## WSAPME API Integration

### Authentication

All WSAPME API requests use the following header:
```
x-wsapme-token: YOUR_USER_TOKEN
```

The token is stored in `.env` as `WSAPME_USER_TOKEN` and is only accessed server-side for security.

### Base URLs

- **Send Message API**: `https://api.wsapme.com/v1/sendMessage2`
- **Message Info API**: `https://master.wsapme.com/api/messageInfo`

### Device Configuration

- **Device ID**: `5850` (hardcoded in client functions)
- **Test Phone Number**: `+60189026292` (enforced via validation)

### Safety Features

The `sendMessage()` function includes phone number validation that **only** allows sending to `+60189026292` or `60189026292`. This prevents accidental sends to other numbers or groups.

---

## API Endpoints

### Endpoints That Don't Require Device Online

1. **GET /api/blast-data** - Returns mock blast metrics (currently)
2. **GET /api/test-mock?type=blast|send|status** - Mock test endpoint
3. **POST /api/test-mock** - Mock POST endpoint for testing

### Endpoints That Require Device Online

1. **POST /api/test-send** - Send message via WSAPME API
2. **POST /api/test-message-info** - Get message status from WSAPME API

See [API_REFERENCE.md](./API_REFERENCE.md) for detailed endpoint documentation.

---

## Components

### FunnelChart (`components/FunnelChart.tsx`)

Displays a left-to-right horizontal funnel chart showing marketing blast metrics.

**Stages:**
- Sent (Blue-500)
- Received (Blue-400)
- Read (Blue-300)
- Replied (Green-400)
- Closed (Green-500)

**Features:**
- Shows count and percentage for each stage
- Displays drop-off percentages between stages
- Shows conversion rates at the bottom
- Responsive design

### Main Page (`app/page.tsx`)

Main dashboard page that:
- Fetches blast data from `/api/blast-data`
- Displays the funnel chart
- Provides test buttons for sending messages and checking status

---

## Testing

### Testing Without Device

Use the mock endpoints for frontend testing:
- `GET /api/test-mock?type=blast` - Mock blast data
- `GET /api/test-mock?type=send` - Mock send response
- `GET /api/test-mock?type=status` - Mock status response

### Testing With Device Online

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for comprehensive testing procedures.

---

## Current Status

### ✅ Completed

- [x] Project setup with Next.js and TypeScript
- [x] WSAPME API client with authentication
- [x] Test endpoints for send and message info
- [x] Mock endpoints for testing without device
- [x] Funnel chart visualization component
- [x] Basic UI with test functionality
- [x] Safety validation for phone numbers
- [x] Documentation

### ⏳ Pending (Device Offline)

- [ ] Map WSAPME status codes to funnel stages
- [ ] Implement real data aggregation in `/api/blast-data`
- [ ] Store message IDs and statuses (database integration needed)
- [ ] Test actual WSAPME API responses

### 📋 Future Enhancements

See [Future Enhancements](#future-enhancements) section below.

---

## Future Enhancements

### Phase 1: Core Features

- [ ] Database integration (PostgreSQL with Prisma)
- [ ] Real data aggregation from WSAPME API
- [ ] Status code mapping and tracking
- [ ] Message history storage

### Phase 2: Filtering & Analytics

- [ ] Date/time range filtering
- [ ] Filter by blast tags
- [ ] Filter by follow-up stage
- [ ] Filter by blast status
- [ ] Export reports (CSV/PDF)

### Phase 3: Advanced Features

- [ ] Blast management UI (create, edit, delete blasts)
- [ ] Recipient management per blast
- [ ] Webhook integration for real-time status updates
- [ ] Scheduled blast reports
- [ ] User authentication

### Phase 4: Bulk Operations

- [ ] Batch message sending
- [ ] Bulk status checking
- [ ] Automatic status polling
- [ ] Background job processing for large blasts

---

## Known Issues & Limitations

1. **Device Offline:** Cannot test WSAPME API integration until device is online
2. **Mock Data:** `/api/blast-data` currently returns mock data - needs real integration
3. **Single Message:** `/api/messageInfo` appears to be single-message only - may need multiple calls for bulk status
4. **Status Code Mapping:** Status code meanings not yet determined - need testing
5. **No Database:** Currently no persistence - all data is ephemeral
6. **Single Device:** Device ID is hardcoded - may need multi-device support later

---

## Troubleshooting

### CSS Not Rendering

1. Ensure `@tailwindcss/postcss` is installed
2. Check `postcss.config.js` uses `@tailwindcss/postcss`
3. Verify `app/globals.css` contains `@import "tailwindcss";`
4. Clear `.next` folder and restart dev server

### API Authentication Errors

1. Verify `WSAPME_USER_TOKEN` is set correctly in `.env`
2. Check token hasn't expired
3. Ensure token is valid for the device being used

### Device Not Found Errors

1. Verify device is active in WSAPME dashboard
2. Check device ID is correct (should be 5850)
3. Ensure device is online and connected

---

## Quick Reference

- **Main Dashboard:** [http://localhost:3000](http://localhost:3000)
- **Mock Blast Data:** `GET /api/test-mock?type=blast`
- **Send Message:** `POST /api/test-send` (requires device online)
- **Check Status:** `POST /api/test-message-info` (requires device online)

---

## Contact & Support

For issues or questions:
- Check WSAPME API documentation: https://api.wsapme.com/doc/
- Review documentation in `docs/` folder
- Check browser console and server logs for errors

---

**Last Updated:** January 2025  
**Project Status:** In Development - Ready for testing when device comes online

