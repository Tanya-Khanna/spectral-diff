---
name: ui-screenshot-refresh
description: Placeholder for screenshot refresh on UI changes
version: 1
triggers:
  - type: manual
actions:
  - type: shell
    command: echo "Screenshots would be updated via Playwright"
---

# UI Screenshot Refresh

Manual hook to refresh demo screenshots when UI components change.

Files to watch:
- apps/web/src/components/RoomTile.tsx
- apps/web/src/components/LanternOverlay.tsx
- apps/web/src/app/house/page.tsx
