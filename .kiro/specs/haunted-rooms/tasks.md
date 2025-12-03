# Haunted Rooms — Tasks

- [x] 1. Create risk engine module
  - [x] 1.1 Define types (RoomRiskResult, RiskSignal, RiskVisual)
  - [x] 1.2 Implement scoring rules with exact weights
  - [x] 1.3 Implement computeRoomRisk function
  - [x] 1.4 Implement riskToVisual mapping
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Create RoomTile component
  - [x] 2.1 Render room with dynamic darkness based on risk band
  - [x] 2.2 Implement Scratches sub-component with style variants
  - [x] 2.3 Add risk badge with artifact-tag styling
  - [x] 2.4 Add sigil rendering (💀 for critical, ⚠️ for warning)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4_

- [x] 3. Create FogLayer component
  - [x] 3.1 Implement fog with intensity levels
  - [x] 3.2 Add reveal-on-hover behavior
  - [x] 3.3 Respect reduceEffects toggle
  - _Requirements: 1.2, 1.3, 1.4, 1.5_

- [x] 4. Create DiffMuralPanel component
  - [x] 4.1 Render file header with stats
  - [x] 4.2 Add Risk Breakdown accordion
  - [x] 4.3 List hunks with importance scores
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 5. Wire House page
  - [x] 5.1 Compute risks for all files
  - [x] 5.2 Sort by risk (highest first)
  - [x] 5.3 Pass riskResult to RoomTile and DiffMuralPanel
  - [x] 5.4 Implement keyboard navigation
  - _Requirements: 1.1, 3.1_
