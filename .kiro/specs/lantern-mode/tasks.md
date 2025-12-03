# Lantern Mode — Tasks

- [x] 1. Implement LanternCursor data model
  - [x] 1.1 Define LanternCursor interface in demo/pr.ts
  - [x] 1.2 Add cursor state to SpectralProvider
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Create LanternOverlay component
  - [x] 2.1 Render lantern cone effect
  - [x] 2.2 Display single hunk with diff highlighting
  - [x] 2.3 Show red flags section
  - [x] 2.4 Add risk badge with tooltip showing top signals
  - [x] 2.5 Add critical findings banner
  - _Requirements: 1.1, 3.1, 3.2, 3.3_

- [x] 3. Create MiniMap component
  - [x] 3.1 Render room indicators
  - [x] 3.2 Show hunk dots within rooms
  - [x] 3.3 Highlight current position
  - [x] 3.4 Handle room click navigation
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 4. Wire Lantern page
  - [x] 4.1 Compute risks and sort files
  - [x] 4.2 Initialize cursor at highest-risk file
  - [x] 4.3 Implement getNextCursor/getPrevCursor
  - [x] 4.4 Pass riskResult to LanternOverlay
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 5. Implement keyboard navigation
  - [x] 5.1 N for next, P for prev
  - [x] 5.2 C for exorcise, Escape for exit
  - [x] 5.3 Play whoosh sound on navigation
  - _Requirements: 1.2, 1.3, 1.4, 1.5_

- [x] 6. Add progress indicators
  - [x] 6.1 Hunk X / Y counter
  - [x] 6.2 Room i / k counter
  - [x] 6.3 Progress bar
  - _Requirements: 2.1, 2.2, 2.3, 2.4_
