---
name: regen-demo-snapshot
description: Rebuild when demo data changes
version: 1
triggers:
  - type: onFileSave
    pattern: "apps/web/src/lib/demo/**"
actions:
  - type: shell
    command: pnpm -C apps/web build
---

# Regenerate Demo Snapshot

Rebuilds when demo PR data is modified to ensure consistency.
