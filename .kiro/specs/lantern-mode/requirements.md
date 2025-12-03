# Lantern Mode — Requirements

## Introduction
Lantern Mode reduces cognitive load by showing exactly one diff hunk at a time, guiding reviewers through the PR in risk-priority order.

## Glossary
- **Lantern Cursor**: Current position (fileIndex, hunkIndex)
- **Hunk**: A contiguous block of changes in a file
- **MiniMap**: Visual progress indicator showing rooms and hunks

## Requirements

### Requirement 1
**User Story:** As a reviewer, I want to focus on one hunk at a time, so that I can review without overwhelm.

#### Acceptance Criteria
1. WHEN Lantern Mode starts THEN the system SHALL display exactly one hunk
2. WHEN the user presses N THEN the system SHALL navigate to the next hunk by importance
3. WHEN the user presses P THEN the system SHALL navigate to the previous hunk
4. WHEN the user presses Escape THEN the system SHALL exit to House view
5. WHEN the user presses C THEN the system SHALL navigate to Exorcise Chamber

### Requirement 2
**User Story:** As a reviewer, I want to see my progress, so that I know how much review remains.

#### Acceptance Criteria
1. WHEN viewing a hunk THEN the system SHALL display "Hunk X / Y" progress
2. WHEN viewing a hunk THEN the system SHALL display "Room i / k" progress
3. WHEN viewing a hunk THEN the system SHALL display a MiniMap showing all rooms
4. WHEN viewing a hunk THEN the system SHALL display a progress bar

### Requirement 3
**User Story:** As a reviewer, I want to see risk context, so that I understand why this hunk matters.

#### Acceptance Criteria
1. WHEN viewing a hunk THEN the system SHALL display the file's risk score and band
2. WHEN the file has critical findings THEN the system SHALL display a critical findings banner
3. WHEN hovering the risk badge THEN the system SHALL show top 2 signals as tooltip
