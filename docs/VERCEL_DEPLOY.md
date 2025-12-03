# Vercel Production Deployment Guide

## Architecture Decision: Split Deploy (Recommended)

**apps/web** → Vercel  
**services/api** → Railway / Fly.io / Render

### Why Split Deploy?

1. **Security isolation**: API handles GitHub tokens separately from frontend
2. **Independent scaling**: API and frontend can scale independently
3. **Simpler deployment**: Each service deploys with its native tooling
4. **Faster iteration**: Update API without rebuilding frontend and vice versa

---

## Environment Variables

### apps/web (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Full URL to API service (e.g., `https://spectral-api.railway.app`) |
| `NEXT_PUBLIC_DEMO_MODE` | No | Set to `true` for demo mode (no real GitHub API calls) |

### services/api (Railway/Fly/Render)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 5050, platforms usually set this) |
| `CORS_ORIGIN` | Yes | Frontend URL for CORS (e.g., `https://spectral-diff.vercel.app` - no trailing slash) |
| `CORS_ORIGIN_REGEX` | No | Anchored regex for preview URLs (e.g., `^https://spectral-diff(-[a-z0-9-]+)?\\.vercel\\.app$`) |

---

## Deployment Steps

### 1. Deploy API to Railway

**Step 1: Install Railway CLI + Login**
```bash
npm install -g @railway/cli
railway login
```

**Step 2: Create/link Railway project**
```bash
# From repo root
railway init
```

**Step 3: Config as Code (already in repo)**

The `railway.json` at repo root configures the build:
```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "RAILPACK",
    "buildCommand": "corepack enable && pnpm install --frozen-lockfile && pnpm --filter @spectral/api build"
  },
  "deploy": {
    "startCommand": "pnpm --filter @spectral/api start",
    "healthcheckPath": "/health",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

**Note:** NIXPACKS is deprecated; use RAILPACK (or omit builder for default).

**Step 4: Set environment variables**
```bash
# Required: exact Vercel production origin (no trailing slash)
railway variables set CORS_ORIGIN=https://YOUR_VERCEL_PROD_DOMAIN

# Optional: regex for preview URLs (include https://)
railway variables set CORS_ORIGIN_REGEX="^https://spectral-diff(-[a-z0-9-]+)?\\.vercel\\.app$"
```

**Note:** You do NOT need to set `PORT` — Railway injects it automatically.

**Step 5: Deploy**
```bash
railway up
```

**Step 6: Generate public domain**
1. Open Railway Dashboard → your service → Settings / Networking
2. Click "Generate Domain" or enable public URL
3. Copy the URL (e.g., `https://spectral-api.up.railway.app`)
4. This becomes your `NEXT_PUBLIC_API_URL` for Vercel

### 2. Deploy Frontend to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy (from repo root)
vercel --prod
```

**Vercel Configuration:**

**Option A: Dashboard Settings (Recommended)**
- Project Root Directory: `.` (repo root)
- Build Command: `pnpm --filter @spectral/web build`
- Output Directory: `apps/web/.next`
- Install Command: `pnpm install --frozen-lockfile`
- Framework: Next.js

**Option B: vercel.json (Alternative)**
```json
{
  "buildCommand": "pnpm --filter @spectral/web build",
  "outputDirectory": "apps/web/.next",
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": "nextjs"
}
```

**Environment Variables in Vercel Dashboard:**
1. Go to Project Settings → Environment Variables
2. Add `NEXT_PUBLIC_API_URL` = `https://your-api.railway.app`
3. For demo deployments, add `NEXT_PUBLIC_DEMO_MODE` = `true`

---

## Demo Mode Instructions

Demo mode uses mock data instead of real GitHub API calls. Useful for:
- Public demos without exposing tokens
- Testing UI without GitHub connection
- Preview deployments

### Enable Demo Mode

**Option 1: Environment Variable**
```bash
NEXT_PUBLIC_DEMO_MODE=true
```

**Option 2: Vercel Preview Deployments**
Set `NEXT_PUBLIC_DEMO_MODE=true` only for Preview environment in Vercel dashboard.

### Demo Mode Behavior

- Shows sample PR data from `apps/web/src/lib/demo/`
- All GitHub actions (comment, approve, patch) show success toasts but don't call API
- ModeBanner displays "Demo Mode" indicator
- No GitHub token required

---

## CORS Configuration

The API must allow requests from the frontend domain.

**services/api/src/index.ts** already uses `cors()` middleware. For production, update to:

```typescript
import cors from "cors";

const allowedOrigins = [
  process.env.CORS_ORIGIN,
  "http://localhost:3000", // Local dev
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
```

---

## CI/CD Pipeline

The `.github/workflows/ci.yml` runs on every push/PR:

```yaml
steps:
  - Install dependencies (pnpm install --frozen-lockfile)
  - TypeScript check (pnpm typecheck)
  - Lint (pnpm lint)
  - Test (pnpm test)
  - Build web (with NEXT_PUBLIC_DEMO_MODE=true)
  - Build api
```

### Vercel Auto-Deploy

Vercel automatically deploys on push to `main`. Configure in Vercel dashboard:
- Production Branch: `main`
- Preview Branches: All other branches

### Railway Configuration

**Railway Settings:**
- Root Directory: `.` (repo root) or `services/api` (if detached)
- Build Command: `corepack enable && pnpm install --frozen-lockfile && pnpm --filter @spectral/api build`
- Start Command: `pnpm --filter @spectral/api start`
- Environment Variables: `CORS_ORIGIN=https://your-vercel-domain.vercel.app`

**Note:** `corepack enable` ensures pnpm is available on hosts that don't have it pre-installed.

**Alternative: Fly.io/Render**
Same commands work for other platforms:
```bash
# Build (with Corepack for pnpm support)
corepack enable && pnpm install --frozen-lockfile && pnpm --filter @spectral/api build

# Start
pnpm --filter @spectral/api start
```

---

## Health Checks

**API Health Endpoint:**
```
GET /health
Response: { "ok": true, "name": "spectral-diff-api" }
```

**Vercel Health:**
Vercel handles health checks automatically for Next.js apps.

---

## Troubleshooting

### "CORS error" in browser console
- Verify `CORS_ORIGIN` env var matches your Vercel domain exactly (include `https://`, no trailing slash)
- Example: `CORS_ORIGIN=https://spectral-diff.vercel.app` (not `...app/`)
- For preview URLs, set anchored regex: `CORS_ORIGIN_REGEX=^https://spectral-diff(-[a-z0-9-]+)?\\.vercel\\.app$`

### "API error: 401" 
- GitHub token expired or invalid
- Token missing required scopes (need `repo` for apply-patch)

### Demo mode not working
- Verify `NEXT_PUBLIC_DEMO_MODE` is set to exactly `true` (string)
- Rebuild after changing env vars (Next.js bakes them at build time)

### Build fails on Vercel
- Check Node.js version matches (20.x)
- Ensure `pnpm-lock.yaml` is committed
- Check build logs for TypeScript errors

---

## Quick Reference

| Service | URL Pattern | Health Check |
|---------|-------------|--------------|
| Frontend | `https://spectral-diff.vercel.app` | Auto |
| API | `https://spectral-api.railway.app` | `/health` |

| Mode | `NEXT_PUBLIC_DEMO_MODE` | `NEXT_PUBLIC_API_URL` |
|------|-------------------------|----------------------|
| Demo | `true` | Not required |
| Real | `false` or unset | Required |

---

## Post-Deploy Smoke Test

After deploying, verify these work:

- [ ] Open `/` → Demo/Live banner shows correct mode
- [ ] Connect PAT → `/gh/me` succeeds (check Network tab)
- [ ] Pick PR → files render in House Map
- [ ] Click workflow room → shows critical sigils (💀 if CI failing)
- [ ] Post comment → appears on GitHub PR
- [ ] Apply Patch → commit created + checks polling visible
