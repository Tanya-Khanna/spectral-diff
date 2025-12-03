# Haunted Rooms — Requirements

## Introduction
The Haunted House Map is the signature screen of Spectral Diff, visualizing PR files as rooms in a haunted house where darkness correlates with risk.

## Glossary
- **Room**: A visual tile representing a changed file in the PR
- **Risk Score**: 0-100 value computed from deterministic signals
- **Band**: Risk category (bright/dim/dark/cursed)
- **Scratch**: Visual line representing code changes

## Requirements

### Requirement 1
**User Story:** As a reviewer, I want to see all changed files as visual rooms, so that I can quickly identify high-risk areas.

#### Acceptance Criteria
1. WHEN the House page loads THEN the system SHALL display all changed files as clickable room tiles
2. WHEN a file has risk score 80-100 THEN the room SHALL appear in "cursed" band with heavy fog and 💀 sigil
3. WHEN a file has risk score 50-80 THEN the room SHALL appear in "dark" band with medium fog and ⚠️ sigil
4. WHEN a file has risk score 20-50 THEN the room SHALL appear in "dim" band with light fog
5. WHEN a file has risk score 0-20 THEN the room SHALL appear in "bright" band with no fog

### Requirement 2
**User Story:** As a reviewer, I want to see code changes visualized as scratches, so that I can understand the nature of changes at a glance.

#### Acceptance Criteria
1. WHEN a file has added lines THEN the room SHALL display bright emerald "fresh scratches"
2. WHEN a file has removed lines THEN the room SHALL display faint gray "scars"
3. WHEN a file has modified lines THEN the room SHALL display amber "bleeding scratches" with shimmer animation
4. WHEN reduce-effects is enabled THEN the system SHALL disable scratch animations

### Requirement 3
**User Story:** As a reviewer, I want to click a room to see file details, so that I can understand what changed.

#### Acceptance Criteria
1. WHEN a user clicks a room THEN the system SHALL open the Diff Mural Panel
2. WHEN the panel opens THEN the system SHALL display file path, language, LOC, test status, and CI status
3. WHEN the panel opens THEN the system SHALL display a Risk Breakdown accordion with all signals
4. WHEN the panel opens THEN the system SHALL list all hunks with importance scores
