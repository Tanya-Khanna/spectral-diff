# Haunted Rooms — Design

## Overview
The Haunted House Map renders PR files as a grid of room tiles, sorted by computed risk score (highest first). Each room's visual properties are driven by the risk engine.

## Architecture
```
/house page
    └── computeAllRisks(demoPR)
        └── For each file:
            ├── computeRoomRisk() → RoomRiskResult
            └── riskToVisual() → RiskVisual
    └── RoomTile (receives riskResult, visual)
        ├── FogLayer (intensity from visual.fogIntensity)
        ├── Scratches (style from visual.scratchStyle)
        └── Sigils (from visual.sigils)
```

## Components

### RoomTile
- Props: `file`, `onClick`, `isSelected`, `riskResult`
- Computes visual from riskResult
- Renders: scratches, fog, door plaque, risk badge, sigils

### FogLayer
- Props: `intensity` (0-100), `revealed` (boolean)
- Renders animated fog wisps when not revealed
- Respects reduceEffects toggle

### DiffMuralPanel
- Props: `file`, `riskResult`, callbacks
- Renders: header, stats, Risk Breakdown accordion, hunks list

## Data Flow
1. Page loads → `computeAllRisks(demoPR)` returns sorted files with risk
2. Grid renders RoomTile for each file
3. Click → selectFile → DiffMuralPanel opens
4. Panel shows risk breakdown from pre-computed riskResult

## Visual Mapping
| Band | bgLightness | fogIntensity | scratchStyle |
|------|-------------|--------------|--------------|
| bright | 22% | none (10) | small |
| dim | 15% | low (30) | medium |
| dark | 10% | med (55) | pulse |
| cursed | 5% | high (80) | bleed |
