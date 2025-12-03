# Kiroween Writeup — Spectral Diff

## Overview
Spectral Diff turns GitHub PR review into a haunted house experience where code risk becomes visual darkness.

## Kiro Usage

### 1. Steering Docs (`.kiro/steering/`)
We use steering docs to ensure consistent, on-brand output:

- **`reviewer-voice.md`**: Defines the spooky-but-professional tone. Every claim must cite a metric. No hallucinations.
- **`risk-rules.md`**: Complete risk scoring rubric with exact weights (+35 CI failing, +40 workflow insecurity, etc.) and visual band mappings.
- **`accessibility.md`**: Contrast rules, reduce-motion mode, keyboard navigation requirements.
- **`product.md`**: Core product principles — every spooky element must improve review speed, focus, or safety.

### 2. Specs (`.kiro/specs/`)
We started with vibe coding for UI exploration, then locked features via specs for deterministic behavior and shipping quality.

| Spec | Status | Description |
|------|--------|-------------|
| `haunted-rooms/` | ✅ Complete | Room tiles, fog, scratches, risk badges |
| `lantern-mode/` | ✅ Complete | One-hunk-at-a-time review with keyboard nav |
| `actions-safety/` | ✅ Complete | GitHub Actions security lint (+40 critical) |

Each spec follows Requirements → Design → Tasks structure.

### 3. Hooks (`.kiro/hooks/`)
Automation hooks that run on file changes:

- **`risk-score-tests.json`**: On change to scoring logic, rebuild to verify
- **`regen-demo-snapshot.json`**: On risk rule changes, regenerate demo data
- **`ui-screenshot-refresh.json`**: On UI changes, refresh demo screenshots (Playwright)

### 4. MCP Server (`mcp/github-mcp/`)
Custom MCP server exposing GitHub PR operations:

**Tools:**
- `list_pull_requests` — List open PRs
- `get_pull_request_files` — Get changed files
- `get_pull_request_checks` — Get CI status
- `post_review_comment` — Post a comment
- `approve_pull_request` — Approve PR
- `request_changes` — Request changes

**Demo:** In the video, we show Kiro executing `request_changes` with a spooky message.

## Technical Highlights

### Risk Engine
Deterministic scoring with exact weights:
- CI failing: +35
- Sensitive paths: +25
- Large LOC: +20
- No tests: +20
- Workflow insecurity: +40 (critical)

### GitHub Actions Security Lint
Regex-based detection of:
- Unpinned actions (@v3, @main — not SHA)
- Broad permissions (write-all)
- PR target attacks (pull_request_target + write)

### Accessibility
- Full keyboard navigation (N/P/C/Escape)
- Reduce-motion toggle
- `prefers-reduced-motion` media query support
- High contrast dark mode

## File Structure
```
.kiro/
├── steering/
│   ├── accessibility.md
│   ├── product.md
│   ├── reviewer-voice.md
│   └── risk-rules.md
├── specs/
│   ├── haunted-rooms/
│   ├── lantern-mode/
│   └── actions-safety/
├── hooks/
│   ├── risk-score-tests.json
│   ├── regen-demo-snapshot.json
│   └── ui-screenshot-refresh.json
└── settings/
    └── mcp.json

mcp/
└── github-mcp/
    ├── src/index.ts
    ├── package.json
    └── tsconfig.json
```
