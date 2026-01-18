# Setup Guide

## Quick Start

### 1. Prerequisites

Ensure you have the following installed:
- **Node.js** 18.0 or higher
- **npm** 9.0 or higher (comes with Node.js)
- A code editor (VS Code recommended)

### 2. Clone/Navigate to Project

```bash
cd "C:\Users\amiey\Desktop\Camis\Work\HIM Wellness TTDI\marketing-blast-tracker"
```

### 3. Install Dependencies

```bash
npm install
```

This will install:
- Next.js 16+
- React 19+
- TypeScript
- Tailwind CSS v4
- Recharts (for charts)
- And other required dependencies

### 4. Environment Configuration

Create a `.env` file in the project root (if it doesn't exist):

```env
WSAPME_USER_TOKEN=your_wsapme_user_token_here
```

**Important:** 
- Replace `your_wsapme_user_token_here` with your actual WSAPME user token
- Never commit the `.env` file to git (it's already in `.gitignore`)
- The token is used server-side only for security

### 5. Start Development Server

```bash
npm run dev
```

The application will start on [http://localhost:3000](http://localhost:3000)

Open your browser and navigate to that URL to see the dashboard.

---

## Development Workflow

### Available Commands

```bash
# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint
```

### Project Structure Overview

```
marketing-blast-tracker/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (server-side)
│   ├── page.tsx           # Main dashboard page
│   └── layout.tsx         # Root layout
├── components/            # React components
├── lib/                   # Utility functions and API clients
├── types/                 # TypeScript type definitions
└── docs/                  # Documentation (this folder)
```

### Hot Reload

The development server automatically reloads when you make changes to:
- React components
- API routes
- TypeScript files
- CSS files

**Note:** Changes to `.env` require restarting the dev server.

---

## Configuration Files

### `package.json`

Contains project dependencies and scripts. Key dependencies:
- `next`: Next.js framework
- `react`: React library
- `typescript`: TypeScript support
- `tailwindcss`: CSS framework
- `recharts`: Chart library

### `tsconfig.json`

TypeScript configuration with:
- Path aliases (`@/*` maps to project root)
- Strict type checking enabled
- Next.js plugin configuration

### `tailwind.config.js`

Tailwind CSS configuration specifying:
- Content paths (where to scan for Tailwind classes)
- Theme customization (currently default)

### `postcss.config.js`

PostCSS configuration using:
- `@tailwindcss/postcss` plugin (Tailwind v4)
- `autoprefixer` for browser compatibility

### `next.config.js`

Next.js configuration (currently minimal/default)

---

## Troubleshooting Setup

### Issue: Dependencies won't install

**Error:** `npm ERR! code ERESOLVE`

**Solution:**
```bash
npm install --legacy-peer-deps
```

---

### Issue: Port 3000 already in use

**Error:** `Port 3000 is already in use`

**Solution:**
- Close other applications using port 3000, OR
- Use a different port:
  ```bash
  npm run dev -- -p 3001
  ```

---

### Issue: Tailwind CSS not working

**Symptoms:** Styles not applying, elements unstyled

**Solution:**
1. Ensure `@tailwindcss/postcss` is installed:
   ```bash
   npm install @tailwindcss/postcss
   ```

2. Check `postcss.config.js` uses `@tailwindcss/postcss`

3. Verify `app/globals.css` contains:
   ```css
   @import "tailwindcss";
   ```

4. Clear Next.js cache:
   ```bash
   rm -rf .next
   # Or on Windows:
   rmdir /s .next
   ```

5. Restart dev server

---

### Issue: TypeScript errors

**Symptoms:** Red squiggly lines, type errors

**Solution:**
1. Verify TypeScript is installed:
   ```bash
   npm list typescript
   ```

2. Check `tsconfig.json` syntax is valid

3. Restart VS Code/editor to reload TypeScript server

4. Run type check:
   ```bash
   npx tsc --noEmit
   ```

---

### Issue: Module not found errors

**Symptoms:** `Cannot find module '@/...'`

**Solution:**
1. Check `tsconfig.json` has path aliases:
   ```json
   "paths": {
     "@/*": ["./*"]
   }
   ```

2. Verify file paths are correct (case-sensitive)

3. Restart dev server

---

## Production Build

To create a production build:

```bash
npm run build
```

This will:
- Compile TypeScript
- Optimize React components
- Build static pages
- Create production bundle

Output will be in `.next` folder.

To test production build locally:

```bash
npm run build
npm run start
```

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `WSAPME_USER_TOKEN` | WSAPME API authentication token | `abc123def456...` |

### Adding More Variables

To add new environment variables:

1. Add to `.env` file:
   ```env
   WSAPME_USER_TOKEN=your_token
   NEW_VARIABLE=value
   ```

2. Access in server-side code:
   ```typescript
   const value = process.env.NEW_VARIABLE;
   ```

3. **Important:** For client-side access, prefix with `NEXT_PUBLIC_`:
   ```env
   NEXT_PUBLIC_CLIENT_VAR=value
   ```
   ```typescript
   const clientValue = process.env.NEXT_PUBLIC_CLIENT_VAR;
   ```

**Security Note:** Never expose sensitive tokens to the client-side!

---

## IDE Setup

### VS Code Recommended Extensions

- **ES7+ React/Redux/React-Native snippets** - React shortcuts
- **Tailwind CSS IntelliSense** - Tailwind autocomplete
- **TypeScript Vue Plugin (Volar)** - TypeScript support
- **Prettier** - Code formatting
- **ESLint** - Code linting

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

---

## Next Steps

After setup is complete:

1. ✅ Verify `.env` file has `WSAPME_USER_TOKEN`
2. ✅ Start dev server (`npm run dev`)
3. ✅ Open [http://localhost:3000](http://localhost:3000)
4. ✅ Verify UI loads correctly
5. ✅ Test mock endpoints (device not required)
6. ⏳ Wait for device to come online to test WSAPME API
7. ⏳ Follow [Testing Guide](./TESTING_GUIDE.md) when ready

---

## Testing Without Device

You can test the application without the device being online using mock endpoints:

- Mock blast data: `GET /api/test-mock?type=blast`
- Mock send: `GET /api/test-mock?type=send`
- Mock status: `GET /api/test-mock?type=status`

See [API_REFERENCE.md](./API_REFERENCE.md) for details.

---

## Quick Reference

- **Main Dashboard:** http://localhost:3000
- **Dev Server:** `npm run dev`
- **Build:** `npm run build`
- **Environment:** `.env` file
- **Documentation:** `docs/` folder

---

**Questions or Issues?**

Refer to:
- [Main README](./README.md) - Project overview
- [API Reference](./API_REFERENCE.md) - API documentation
- [Testing Guide](./TESTING_GUIDE.md) - Testing procedures

---

**Last Updated:** January 2025

