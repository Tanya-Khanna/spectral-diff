# Spectral Diff — Demo Guide

## Quick Start

### Real Mode (Default)

```bash
# Start API server
pnpm dev:api

# Start web app (real mode is default)
NEXT_PUBLIC_API_URL=http://localhost:5050 pnpm dev:web
```

Open http://localhost:3000 and connect your GitHub PAT.

### Demo Mode (Explicit)

```bash
# Demo mode must be explicitly enabled
NEXT_PUBLIC_DEMO_MODE=true pnpm dev:web
```

You'll see the **👻 Demo Mode** banner. No API required.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_DEMO_MODE` | No | `false` | Set to `"true"` only for demos |
| `NEXT_PUBLIC_API_URL` | Yes | - | API server URL (required, no fallback) |
| `PORT` | No | `5050` | API server port |
| `CORS_ORIGIN` | Yes (API) | - | Frontend URL for CORS |
| `CORS_ORIGIN_REGEX` | No | - | Anchored regex for preview URLs (e.g., `^https://spectral-diff(-[a-z0-9-]+)?\\.vercel\\.app$`) |

### .env.local Example

```bash
# Real mode (default, recommended)
NEXT_PUBLIC_API_URL=http://localhost:5050

# Demo mode (explicit opt-in only)
# NEXT_PUBLIC_DEMO_MODE=true
```

**Important:** Real mode is the default. Demo mode must be explicitly enabled to prevent accidental deployment of demo builds.

---

## Mode Differences

### Demo Mode (`NEXT_PUBLIC_DEMO_MODE=true`)

- ✅ Uses built-in demo PR data
- ✅ All UI features work
- ⚠️ Destructive actions disabled:
  - Apply Patch → Shows tooltip "Connect to GitHub"
  - Request Changes → Shows tooltip "Connect to GitHub"
  - Approve → Hidden
- ⚠️ Post Comment → Shows success toast but no API call
- 🏷️ **👻 Demo Mode** banner visible on all screens

### Real Mode (`NEXT_PUBLIC_DEMO_MODE=false`)

- ✅ Connects to real GitHub PRs
- ✅ All actions hit real GitHub API
- ✅ Apply Patch creates real commits
- ⚠️ Requires valid GitHub PAT
- ⚠️ No fallback to demo data on error
- ⚠️ Requires `NEXT_PUBLIC_API_URL` to be set (shows error if missing)
- 🏷️ **🔗 Live Mode** banner when connected

---

## GitHub PAT Setup

### Required Scopes

- `repo` — Full control of private repositories
- `read:user` — Read user profile data

### Creating a PAT

1. Go to GitHub → Settings → Developer settings
2. Personal access tokens → Tokens (classic)
3. Generate new token
4. Select scopes: `repo`, `read:user`
5. Copy token (classic: `ghp_...`, fine-grained: `github_pat_...`)

---

## Demo Flow

### 1. Start in Demo Mode

```bash
pnpm dev
```

Explore the UI with fake data:
- View haunted rooms
- Navigate with Lantern Mode
- See risk scores and red flags

### 2. Connect GitHub

1. Enter your PAT
2. Enter owner/repo
3. Click "Test" to validate
4. Click "Connect"

### 3. Load Real PR

1. Select a PR from the picker
2. Watch rooms populate with real files
3. Risk engine analyzes real diffs

### 4. Take Action

- **Post Comment** — Demo: simulated (toast only) | Real: posts to GitHub
- **Request Changes** — Real mode only (disabled in demo)
- **Approve** — Real mode only (hidden in demo)
- **Apply Patch** — Real mode only, creates commit (disabled in demo)

---

## Demo Repository Setup

For the best demo, create a test repo with risky files:

### 1. Workflow with Security Issues

`.github/workflows/ci.yml`:
```yaml
name: CI
on:
  pull_request_target:
    branches: [main]

permissions: write-all

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@main
```

### 2. Auth File with Issues

`src/auth/login.ts`:
```typescript
const SECRET = process.env.SECRET || 'default-secret';
// TODO: implement validation
```

### 3. Payment File

`src/payments/processor.ts`:
```typescript
export async function charge(amount: number) {
  return stripe.charges.create({ amount });
}
```

### Expected Risk Scores

| File | Risk | Band | Signals |
|------|------|------|---------|
| `.github/workflows/ci.yml` | 80-100 | cursed | Workflow insecurity |
| `src/auth/login.ts` | 50-80 | dark | Sensitive path, no tests |
| `src/payments/processor.ts` | 50-80 | dark | Sensitive path |
| `README.md` | 0-20 | bright | Low risk |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `L` | Start Lantern Mode |
| `N` | Next hunk |
| `P` | Previous hunk |
| `C` | Open Exorcise Chamber |
| `Escape` | Go back / Close panel |
| `Tab` | Navigate UI elements |
| `Enter` | Select / Confirm |

---

## Troubleshooting

### "API Not Configured" Error

- Set `NEXT_PUBLIC_API_URL` to your deployed API
- In production, localhost URLs are blocked
- Ensure API is running and accessible

### "Invalid token" Error

- Ensure PAT has required scopes
- Check token hasn't expired
- Token should look like `ghp_...` (classic) or `github_pat_...` (fine-grained)

### "No open pull requests"

- Create a PR in the repository
- Ensure PR is open (not merged/closed)
- Check owner/repo spelling

### Risk Scores Seem Wrong

- Risk is computed from signals, not arbitrary
- Click room to see Risk Breakdown accordion
- Check if CI is failing (+35 points)
- Hover risk badge in Lantern Mode for signal tooltip

### Actions Disabled

- Check mode banner (Demo vs Live)
- Connect GitHub for destructive actions
- Ensure PR is loaded (not demo data)

---

## API Endpoints

For integration testing:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/gh/me` | GET | Validate token |
| `/gh/pulls` | GET | List open PRs |
| `/gh/pulls/:n/files` | GET | Get PR files |
| `/gh/pulls/:n/meta` | GET | Get PR metadata |
| `/gh/pulls/:n/checks` | GET | Get check runs |
| `/gh/pulls/:n/review` | POST | Submit review |
| `/gh/pulls/:n/comment` | POST | Post comment |
| `/gh/pulls/:n/apply-patch` | POST | Apply patch |

All require `x-gh-token` header.

---

## Running Tests

```bash
# Unit tests
pnpm --filter @spectral/web test

# API tests
pnpm --filter @spectral/api test

# E2E tests (requires running app)
pnpm --filter @spectral/web test:e2e
```
