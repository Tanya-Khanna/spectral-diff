# GitHub Actions Safety — Tasks

- [x] 1. Create actionsLint module
  - [x] 1.1 Define WorkflowFinding type
  - [x] 1.2 Implement UNPINNED_ACTION_PATTERN regex
  - [x] 1.3 Implement BROAD_PERMISSIONS patterns
  - [x] 1.4 Implement PR_TARGET detection
  - [x] 1.5 Implement lintWorkflowDiff function
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1_

- [x] 2. Integrate with risk engine
  - [x] 2.1 Add isWorkflowFile helper to rules.ts
  - [x] 2.2 Call lintWorkflowDiff in computeRoomRisk
  - [x] 2.3 Add WORKFLOW_INSECURITY signal (+40)
  - [x] 2.4 Populate criticalFindings from findings
  - [x] 2.5 Override band to at least "dark" when findings exist
  - _Requirements: 1.4, 2.3, 3.2, 3.3_

- [x] 3. Add demo workflow file
  - [x] 3.1 Create .github/workflows/ci.yml in demo data
  - [x] 3.2 Include unpinned actions (@v3, @main, @master)
  - [x] 3.3 Include permissions: write-all
  - [x] 3.4 Include pull_request_target trigger
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1_

- [x] 4. Wire UI display
  - [x] 4.1 Show 💀 sigil on workflow rooms with findings
  - [x] 4.2 Display critical findings in Risk Breakdown
  - [x] 4.3 Show critical findings banner in Lantern
  - _Requirements: 3.3_
