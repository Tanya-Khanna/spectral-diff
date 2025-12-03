# Spectral Diff — API Contract

## Overview

The API server (`services/api`) proxies requests to the GitHub API, adding authentication handling and standardized error responses.

**Base URL**: `http://localhost:5050` (development)

---

## Authentication

All `/gh/*` endpoints require the `x-gh-token` header:

```http
x-gh-token: ghp_your_personal_access_token
```

### Required PAT Scopes

**Recommended:** Classic PAT with `repo` scope (simplest, works for all features).

| Scope | Required For |
|-------|--------------|
| `repo` | All PR operations, file access, reviews, apply-patch |
| `read:user` | `/gh/me` endpoint |

**Alternative:** Fine-grained PATs may work if they grant:
- `Pull requests: Read and write`
- `Contents: Read and write` (for apply-patch)

**Note:** For public repos only, `public_repo` scope may suffice for some read operations, but `repo` is recommended for full functionality including apply-patch.

---

## Standard Response Format

### Success Response

All endpoints return a consistent envelope:

```json
{
  "ok": true,
  "data": { ... }
}
```

All endpoints use this envelope consistently — `data` contains the payload (object or array).

### Error Response

```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description",
    "details": { ... }  // Optional
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `MISSING_TOKEN` | 401 | No `x-gh-token` header provided |
| `INVALID_TOKEN_FORMAT` | 401 | Token doesn't match expected format |
| `UNAUTHORIZED` | 401 | Token is invalid or expired |
| `FORBIDDEN` | 403 | Insufficient permissions (bad scopes) |
| `RATE_LIMITED` | 403 | GitHub API rate limit exceeded |
| `NOT_FOUND` | 404 | Repository or resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `GITHUB_ERROR` | 4xx/5xx | Other GitHub API error |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Endpoints

### GET /gh/me

Validate token and get authenticated user info.

**Response:**
```json
{
  "ok": true,
  "data": {
    "username": "octocat",
    "avatarUrl": "https://avatars.githubusercontent.com/u/1?v=4",
    "rateLimit": {
      "remaining": 4999,
      "limit": 5000,
      "reset": "2024-01-01T12:00:00.000Z"
    }
  }
}
```

---

### GET /gh/rate_limit

Get current rate limit status.

**Response:**
```json
{
  "ok": true,
  "data": {
    "remaining": 4999,
    "limit": 5000,
    "reset": "2024-01-01T12:00:00.000Z"
  }
}
```

---

### GET /gh/pulls

List open pull requests for a repository.

**Query Parameters:**
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `owner` | string | Yes | - | Repository owner |
| `repo` | string | Yes | - | Repository name |
| `state` | string | No | `open` | `open`, `closed`, or `all` |

**Example:**
```
GET /gh/pulls?owner=octocat&repo=hello-world&state=open
```

**Response:**
```json
{
  "ok": true,
  "data": [
    { "number": 123, "title": "Add feature", "state": "open", ... }
  ]
}
```

---

### GET /gh/pulls/:number/files

Get files changed in a pull request with diff patches.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `owner` | string | Yes | Repository owner |
| `repo` | string | Yes | Repository name |

**Example:**
```
GET /gh/pulls/123/files?owner=octocat&repo=hello-world
```

**Response:**
```json
{
  "ok": true,
  "data": [
    { "filename": "src/app.ts", "status": "modified", "additions": 10, "deletions": 2, "patch": "..." }
  ]
}
```

---

### GET /gh/pulls/:number/meta

Get PR metadata including head SHA and refs.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `owner` | string | Yes | Repository owner |
| `repo` | string | Yes | Repository name |

**Response:**
```json
{
  "ok": true,
  "data": {
    "number": 123,
    "headSha": "abc123...",
    "headRef": "feature-branch",
    "baseRef": "main",
    "title": "Add new feature",
    "body": "Description...",
    "user": "octocat",
    "state": "open"
  }
}
```

---

### GET /gh/pulls/:number/checks

Get CI check runs for a PR.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `owner` | string | Yes | Repository owner |
| `repo` | string | Yes | Repository name |
| `ref` | string | Yes | Commit SHA to check |

**Example:**
```
GET /gh/pulls/123/checks?owner=octocat&repo=hello-world&ref=abc123
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "total_count": 5,
    "check_runs": [
      { "id": 1, "name": "CI", "status": "completed", "conclusion": "success" }
    ]
  }
}
```

---

### POST /gh/pulls/:number/review

Submit a PR review (approve, request changes, or comment).

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `owner` | string | Yes | Repository owner |
| `repo` | string | Yes | Repository name |

**Request Body:**
```json
{
  "event": "APPROVE",  // or "REQUEST_CHANGES" or "COMMENT"
  "body": "LGTM! 👻"   // Optional for APPROVE
}
```

**Response:**
```json
{
  "ok": true,
  "data": { ... }  // GitHub review object
}
```

---

### POST /gh/pulls/:number/comment

Post a general comment on a PR (issue comment, not inline).

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `owner` | string | Yes | Repository owner |
| `repo` | string | Yes | Repository name |

**Request Body:**
```json
{
  "body": "Great work! 👻"
}
```

**Response:**
```json
{
  "ok": true,
  "data": { ... }  // GitHub comment object
}
```

**Note:** Inline comments (on specific lines) are not currently supported. All comments are posted as general PR comments.

---

### POST /gh/pulls/:number/apply-patch

Apply a code fix by creating a new commit on the PR branch.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `owner` | string | Yes | Repository owner |
| `repo` | string | Yes | Repository name |

**Request Body:**
```json
{
  "headRef": "feature-branch",
  "headSha": "abc123...",  // Must be exactly 40 characters
  "commitMessage": "🔧 Fix: Apply Spectral Diff suggestion",
  "fileEdits": [
    {
      "path": "src/auth/login.ts",
      "content": "// Fixed file content..."
    }
  ]
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "commitSha": "def456...",
    "message": "🔧 Fix: Apply Spectral Diff suggestion"
  }
}
```

**Pipeline Steps:**
1. Create blob for each file edit
2. Get base tree from head commit
3. Create new tree with file changes
4. Create commit with new tree
5. Update branch ref (fast-forward push)

---

## Security

### Token Handling

- Tokens are **never logged** to console or error messages
- The `redactToken()` helper removes `ghp_*` and `Bearer *` patterns
- Tokens are only stored in memory during request processing

### Error Messages

Error messages from GitHub are sanitized before being returned:
- Token values are redacted
- Internal paths are not exposed
- Rate limit info is provided for 403 errors

---

## Rate Limiting

GitHub API has rate limits:
- **Authenticated**: 5,000 requests/hour
- **Search API**: 30 requests/minute

The `/gh/me` and `/gh/rate_limit` endpoints return current rate limit status.

When rate limited, the API returns:
```json
{
  "ok": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "GitHub API rate limit exceeded"
  }
}
```

---

## Validation

All inputs are validated using Zod schemas:

- `owner`: Non-empty string
- `repo`: Non-empty string
- `state`: One of `open`, `closed`, `all`
- `headSha`: Exactly 40 characters
- `event`: One of `APPROVE`, `REQUEST_CHANGES`, `COMMENT`
- `body`: Non-empty string (for comments)
- `fileEdits`: Array with at least one item

Invalid inputs return:
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      { "path": ["owner"], "message": "Required" }
    ]
  }
}
```

---

## Testing

Run API tests:
```bash
pnpm --filter @spectral/api test
```

Tests cover:
- ✅ 401 Unauthorized (bad credentials)
- ✅ 403 Forbidden (rate limit, bad scopes)
- ✅ 404 Not Found (missing repo)
- ✅ Token redaction
- ✅ All endpoint success cases
- ✅ Validation errors
