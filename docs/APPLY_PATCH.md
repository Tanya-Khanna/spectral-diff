# Spectral Diff — Apply Patch Feature

## Overview

The "Apply Patch" feature allows reviewers to directly commit suggested fixes to a PR branch without leaving Spectral Diff. This creates a real commit on the PR's head branch using the GitHub Git Data API.

---

## Requirements

### Token Scopes

Your GitHub Personal Access Token (PAT) must have:

| Scope | Required | Purpose |
|-------|----------|---------|
| `repo` | **Yes** | Full control of private repositories (includes push access) |
| `read:user` | Optional | Display username in UI |

**Note:** The `repo` scope grants write access to all repositories you have access to. For public repos only, `public_repo` may suffice.

### Repository Permissions

You must have **write access** to the repository:
- Be a collaborator with push permissions
- Be a member of a team with write access
- Be the repository owner

### Branch Requirements

- The PR's head branch must **not be protected** with rules that block direct pushes
- If branch protection requires reviews, the commit will succeed but checks may fail
- Force push is **not used** — only fast-forward commits

---

## How It Works

### Pipeline Steps

1. **Create Blob** — Upload file content to GitHub's object store
2. **Get Base Tree** — Fetch the current tree from the head commit
3. **Create Tree** — Create a new tree with the modified file
4. **Create Commit** — Create a commit pointing to the new tree
5. **Update Ref** — Fast-forward the branch ref to the new commit

### API Calls

```
POST /repos/{owner}/{repo}/git/blobs        → Create blob
GET  /repos/{owner}/{repo}/git/commits/{sha} → Get base tree
POST /repos/{owner}/{repo}/git/trees        → Create tree
POST /repos/{owner}/{repo}/git/commits      → Create commit
PATCH /repos/{owner}/{repo}/git/refs/heads/{branch} → Update ref
```

---

## UI Flow

### Demo Mode

In demo mode (`NEXT_PUBLIC_DEMO_MODE=true`):
- Apply Patch button is **disabled**
- Tooltip explains: "Connect to GitHub to apply patches"
- No API calls are made

### Real Mode

1. **First Click** — Shows confirmation warning
2. **Second Click** — Executes the patch pipeline
3. **Progress Display** — Shows current step (Blob → Tree → Commit → Push)
4. **Success** — Shows commit SHA, starts polling checks
5. **Check Polling** — Polls for up to 2 minutes with cancel option

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `403 FORBIDDEN` | Missing `repo` scope | Regenerate PAT with `repo` scope |
| `403 Resource not accessible` | No write access | Request collaborator access |
| `409 Conflict` | Branch was updated | Refresh PR and retry |
| `422 Protected branch` | Branch protection rules | Disable protection or use PR |
| `401 UNAUTHORIZED` | Token expired | Reconnect with new token |

### Error Messages in UI

The UI displays specific, actionable error messages:

- **Permission denied** → "Ensure your PAT has 'repo' scope and you have write access"
- **Conflict** → "The branch may have been updated. Refresh and try again."
- **Protected branch** → "Direct pushes are not allowed. Create a new PR instead."
- **Token expired** → "Please reconnect to GitHub."

---

## Check Polling

After a successful commit:

1. **Polling starts** — Checks every 5 seconds
2. **Timeout** — Stops after 2 minutes (24 polls)
3. **User cancel** — Click "Cancel" to stop polling
4. **Results**:
   - ✅ All checks passed
   - ⚠️ Some checks failed
   - ⏱️ Timeout (check GitHub manually)

### API Endpoint Used

Check polling queries the GitHub Check Runs API:

```
GET /repos/{owner}/{repo}/commits/{sha}/check-runs
```

This returns all check runs (GitHub Actions, third-party CI) associated with the commit SHA. The frontend polls this endpoint via:

```
GET /gh/pulls/:number/checks?owner={owner}&repo={repo}&ref={commitSha}
```

**Note:** This uses the Check Runs API, not the legacy Status API or Actions Runs API.

---

## Limitations

### What Apply Patch Can Do

- ✅ Modify existing files
- ✅ Create new files
- ✅ Commit to PR head branch
- ✅ Trigger CI checks

### What Apply Patch Cannot Do

- ❌ Delete files (not implemented)
- ❌ Rename files (not implemented)
- ❌ Modify multiple files atomically (single file per patch)
- ❌ Push to protected branches with required reviews
- ❌ Resolve merge conflicts
- ❌ Force push (always fast-forward)

### Branch Protection Compatibility

| Protection Rule | Compatible? | Notes |
|-----------------|-------------|-------|
| Require PR reviews | ⚠️ Partial | Commit succeeds, but PR may need re-review |
| Require status checks | ✅ Yes | Checks will run on new commit |
| Require signed commits | ❌ No | API commits are not GPG signed |
| Restrict who can push | ⚠️ Depends | Must be in allowed list |
| Block force pushes | ✅ Yes | We don't force push |

---

## Security Considerations

### Token Storage

- Tokens are stored in `localStorage` (client-side only)
- Tokens are **never logged** to console
- Tokens are redacted from error messages

### Commit Attribution

- Commits are attributed to the PAT owner
- Commit message includes "Applied Spectral Diff suggestion"
- No impersonation — commits show who actually made them

### Audit Trail

- All commits appear in PR history
- GitHub shows the commit author
- CI checks run on the new commit

---

## Troubleshooting

### "Permission denied" Error

1. Check PAT has `repo` scope
2. Verify you have write access to the repo
3. Check if branch is protected

### "Conflict detected" Error

1. The PR branch was updated since you loaded it
2. Refresh the page to get latest `headSha`
3. Try applying the patch again

### Checks Not Running

1. Ensure CI is configured for the branch
2. Check if CI is paused or disabled
3. View GitHub Actions tab directly

### Commit Succeeded but PR Shows Conflicts

1. The base branch was updated
2. Merge or rebase the PR branch
3. This is expected GitHub behavior

---

## API Reference

### Apply Patch Endpoint

```
POST /gh/pulls/:number/apply-patch?owner={owner}&repo={repo}
```

**Request Body:**
```json
{
  "headRef": "feature-branch",
  "headSha": "abc123...",
  "commitMessage": "🔧 Fix: path/to/file.ts - Applied Spectral Diff suggestion",
  "fileEdits": [
    {
      "path": "path/to/file.ts",
      "content": "// Fixed file content..."
    }
  ]
}
```

**Success Response:**
```json
{
  "ok": true,
  "commitSha": "def456...",
  "message": "🔧 Fix: path/to/file.ts - Applied Spectral Diff suggestion"
}
```

**Error Response:**
```json
{
  "ok": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions or bad scopes"
  }
}
```
