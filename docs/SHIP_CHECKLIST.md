# Ship Checklist — Production-Real Gate

**Date:** December 3, 2025  
**Version:** 1.0.0

---

## Build & Test Gate

| Check | Status | Command | Result |
|-------|--------|---------|--------|
| TypeScript Compile | ✅ PASS | `pnpm typecheck` | No errors |
| Lint | ✅ PASS | `pnpm lint` | 0 errors, 10 warnings (acceptable) |
| Unit Tests | ✅ PASS | `pnpm test` | 58 tests passed |
| Build (Web) | ✅ PASS | `pnpm --filter @spectral/web build` | Success |
| Build (API) | ✅ PASS | `pnpm --filter @spectral/api build` | Success |

```bash
# Reproduce all checks
pnpm typecheck && pnpm lint && pnpm test && pnpm -r build
```

---

## Placeholder Audit

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 0 | ✅ PASS |
| High | 0 | ✅ PASS |
| Medium | 0 | ✅ PASS (runtime paths) |
| Low | 7 | ✅ ACCEPTABLE (non-runtime) |

**Runtime Code Paths:** Zero High/Medium severity items in runtime code.

---

## Demo Mode Verification

| Check | Status | Evidence |
|-------|--------|----------|
| Demo mode explicit | ✅ PASS | `NEXT_PUBLIC_DEMO_MODE` env var |
| Demo mode labeled | ✅ PASS | ModeBanner shows "👻 Demo Mode" |
| Real mode labeled | ✅ PASS | ModeBanner shows "🔗 Live Mode" |
| Destructive actions blocked in demo | ✅ PASS | `canApplyPatch()`, `canApprove()`, `canRequestChanges()` return false |
| Demo data isolated | ✅ PASS | `demo-guard.test.ts` prevents accidental imports |

```bash
# Verify demo guard test
pnpm --filter @spectral/web test -- --grep "demo-guard"
```

---

## Real Mode End-to-End Flow

| Step | API Endpoint | Status | Notes |
|------|--------------|--------|-------|
| 1. Connect GitHub | `GET /gh/me` | ✅ PASS | Validates PAT, returns username |
| 2. List PRs | `GET /gh/pulls` | ✅ PASS | Returns open PRs for repo |
| 3. Load PR Meta | `GET /gh/pulls/:n/meta` | ✅ PASS | Returns headSha, headRef, baseRef |
| 4. Load PR Files | `GET /gh/pulls/:n/files` | ✅ PASS | Returns files with patches |
| 5. Load Check Runs | `GET /gh/pulls/:n/checks` | ✅ PASS | Returns CI status |
| 6. Post Comment | `POST /gh/pulls/:n/comment` | ✅ PASS | Creates issue comment |
| 7. Request Changes | `POST /gh/pulls/:n/review` | ✅ PASS | Creates review with REQUEST_CHANGES |
| 8. Approve PR | `POST /gh/pulls/:n/review` | ✅ PASS | Creates review with APPROVE |
| 9. Apply Patch | `POST /gh/pulls/:n/apply-patch` | ✅ PASS | Creates commit via Git Data API |

**API Tests:** 21 tests covering all endpoints.

```bash
# Verify API tests
pnpm --filter @spectral/api test
```

---

## Security Audit

| Check | Status | Evidence |
|-------|--------|----------|
| No hardcoded secrets | ✅ PASS | Grep scan found only placeholders |
| Token redaction | ✅ PASS | `redactToken()` covers all PAT patterns |
| .env gitignored | ✅ PASS | Only `.env.example` tracked |
| Tokens in localStorage only | ✅ PASS | API never persists tokens |
| No token logging | ✅ PASS | All console.* statements reviewed |

See: `docs/SECURITY_AUDIT.md`

---

## Environment Configuration

| Variable | Required | Default | Production Value |
|----------|----------|---------|------------------|
| `NEXT_PUBLIC_API_URL` | Yes (real mode) | `http://localhost:5050` | Your API URL |
| `NEXT_PUBLIC_DEMO_MODE` | No | `false` | `true` for demo deploys |
| `PORT` | No | `5050` | Platform sets this |
| `CORS_ORIGIN` | Yes (production) | `http://localhost:3000` | Your Vercel URL |

---

## Deployment Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Vercel        │────▶│   Railway/Fly   │────▶│   GitHub API    │
│   (apps/web)    │     │   (services/api)│     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │ NEXT_PUBLIC_API_URL   │ CORS_ORIGIN
        └───────────────────────┘
```

See: `docs/VERCEL_DEPLOY.md`

---

## CI/CD Pipeline

| Step | Status | Notes |
|------|--------|-------|
| Install | ✅ PASS | `pnpm install --frozen-lockfile` |
| TypeScript | ✅ PASS | `pnpm typecheck` |
| Lint | ✅ PASS | `pnpm lint` |
| Test | ✅ PASS | `pnpm test` |
| Build | ✅ PASS | `pnpm -r build` |

See: `.github/workflows/ci.yml`

---

## Documentation Status

| Document | Status | Path |
|----------|--------|------|
| Deployment Guide | ✅ COMPLETE | `docs/VERCEL_DEPLOY.md` |
| Security Audit | ✅ COMPLETE | `docs/SECURITY_AUDIT.md` |
| API Contract | ✅ COMPLETE | `docs/API_CONTRACT.md` |
| Demo Guide | ✅ COMPLETE | `docs/DEMO_GUIDE.md` |
| Apply Patch Flow | ✅ COMPLETE | `docs/APPLY_PATCH.md` |
| Placeholder Audit | ✅ COMPLETE | `docs/PLACEHOLDER_AUDIT.md` |
| Accessibility | ✅ COMPLETE | `docs/ACCESSIBILITY.md` |
| UI Action Matrix | ✅ COMPLETE | `docs/UI_ACTION_MATRIX.md` |

---

## Final Checklist

### Pre-Deploy (Required)
- [x] All tests pass
- [x] Build succeeds
- [x] No critical/high placeholders in runtime
- [x] Demo mode explicitly labeled
- [x] Real mode flow verified
- [x] Security audit passed
- [x] CORS configured
- [x] Environment vars documented

### Deploy Steps
1. Deploy API to Railway/Fly/Render
2. Set `CORS_ORIGIN` to Vercel domain
3. Deploy Web to Vercel
4. Set `NEXT_PUBLIC_API_URL` to API URL
5. (Optional) Set `NEXT_PUBLIC_DEMO_MODE=true` for demo

### Post-Deploy Verification
- [ ] Visit production URL
- [ ] Verify demo mode works
- [ ] Connect with real PAT
- [ ] Load a real PR
- [ ] Navigate House → Lantern → Exorcise
- [ ] Post a comment (on test PR)
- [ ] Verify ModeBanner shows correct mode

---

## Summary

| Gate | Status |
|------|--------|
| Build & Test | ✅ PASS |
| Placeholder Audit | ✅ PASS |
| Demo Mode | ✅ PASS |
| Real Mode E2E | ✅ PASS |
| Security | ✅ PASS |
| Documentation | ✅ PASS |

**VERDICT: ✅ READY TO SHIP**
