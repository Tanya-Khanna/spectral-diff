---
name: risk-score-tests
description: Run build when risk scoring logic changes
version: 1
triggers:
  - type: onFileSave
    pattern: "apps/web/src/lib/risk/**"
actions:
  - type: shell
    command: pnpm -C apps/web build
---

# Risk Score Tests

Automatically rebuilds when risk scoring logic is modified to catch TypeScript errors early.
