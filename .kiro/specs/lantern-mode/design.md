# Lantern Mode — Design

## Overview
Lantern Mode provides focused, one-hunk-at-a-time review with risk-priority ordering.

## Architecture
```
/lantern page
    └── computeAllRisks(demoPR)
        └── sortedFiles (by computed risk, highest first)
    └── lanternCursor { fileIndex, hunkIndex }
    └── LanternOverlay
        ├── Header (file path, risk badge with tooltip)
        ├── Critical findings banner (if any)
        ├── Diff content (single hunk)
        ├── Red flags
        └── Navigation (Prev/Exorcise/Next)
    └── MiniMap (room progression)
```

## Algorithm
1. Compute risk for all files using risk engine
2. Sort files by computed risk (highest first)
3. Initialize cursor at first file, first hunk
4. Navigation follows risk-sorted order:
   - Next: try next hunk in file, else first hunk of next file
   - Prev: try prev hunk in file, else last hunk of prev file

## Data Model
```typescript
interface LanternCursor {
  fileIndex: number;  // Index in original files array
  hunkIndex: number;  // Index in file.hunks array
}
```

## Components

### LanternOverlay
- Props: file, hunk, currentHunkNum, totalHunks, currentRoomNum, totalRooms, riskResult, callbacks
- Renders lantern cone effect (unless reduceEffects)
- Shows risk badge with tooltip: "Risk: 85 (dark)\n• CI failing: +35\n• No tests: +20"

### MiniMap
- Props: files, cursor, onRoomClick
- Renders room indicators with hunk dots
- Highlights current room and hunk

## Keyboard Shortcuts
| Key | Action |
|-----|--------|
| N | Next hunk |
| P | Previous hunk |
| C | Go to Exorcise |
| Escape | Exit to House |

## Visual Effects
- Lantern cone: radial gradient from amber
- Fog background: 60% intensity
- Lantern flicker animation (unless reduceEffects)
