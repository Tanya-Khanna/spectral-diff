# GitHub Actions Safety — Design

## Overview
The Actions Safety module provides regex-based security linting for GitHub Actions workflow files.

## Architecture
```
actionsLint.ts
    └── lintWorkflowDiff(diffText: string): WorkflowFinding[]
        ├── Check UNPINNED_ACTION_PATTERN
        ├── Check WRITE_ALL_PATTERN
        ├── Check BROAD_WRITE_PATTERN
        └── Check PR_TARGET + write permissions

score.ts
    └── computeRoomRisk()
        └── if isWorkflowFile(path):
            └── lintWorkflowDiff(allDiffText)
            └── if findings.length > 0:
                └── add WORKFLOW_INSECURITY signal (+40)
                └── add criticalFindings
```

## Regex Patterns

### Unpinned Actions
```regex
/uses:\s*[\w\-\.]+\/[\w\-\.]+@(?![a-fA-F0-9]{40}\b)([\w\-\.]+)/gi
```
- Matches: `uses: actions/checkout@v3`, `@main`, `@master`
- Skips: `@8ade135a41bc03ea155e62e844d188df1ea18608` (40-char hex SHA)

### Broad Permissions
```regex
/permissions:\s*write-all/i
/permissions:\s*\n(\s+[\w-]+:\s*write\s*\n){2,}/i
```

### PR Target with Write
```regex
/pull_request_target/i
```
Combined with any of:
- `contents: write`
- `packages: write`
- `actions: write`
- `permissions: write-all`

## Data Model
```typescript
type WorkflowRule = "UNPINNED_ACTION" | "BROAD_PERMISSIONS" | "PR_TARGET_WITH_WRITE";

interface WorkflowFinding {
  rule: WorkflowRule;
  severity: "critical";
  message: string;
  evidence?: string;
}
```

## Integration with Risk Engine
1. `isWorkflowFile(path)` checks if path matches `.github/workflows/*.yml`
2. If true, concatenate all hunk diffText and run `lintWorkflowDiff()`
3. If findings exist:
   - Add signal: "Workflow security issues (N)" +40 critical
   - Add each finding to criticalFindings array
   - Ensure band is at least "dark" (override if bright/dim)
