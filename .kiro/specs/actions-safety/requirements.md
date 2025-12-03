# GitHub Actions Safety — Requirements

## Introduction
The Actions Safety feature detects critical security issues in GitHub Actions workflow files, providing instant feedback on dangerous patterns.

## Glossary
- **Unpinned Action**: A GitHub Action referenced by tag (@v3) instead of SHA
- **Broad Permissions**: Workflow with write-all or multiple write permissions
- **PR Target Attack**: Using pull_request_target with write permissions

## Requirements

### Requirement 1
**User Story:** As a security-conscious reviewer, I want to detect unpinned GitHub Actions, so that I can prevent supply chain attacks.

#### Acceptance Criteria
1. WHEN a workflow uses `actions/checkout@v3` THEN the system SHALL flag as UNPINNED_ACTION (critical)
2. WHEN a workflow uses `actions/checkout@main` THEN the system SHALL flag as UNPINNED_ACTION (critical)
3. WHEN a workflow uses `actions/checkout@8ade135a41bc03ea155e62e844d188df1ea18608` THEN the system SHALL NOT flag (SHA-pinned)
4. WHEN unpinned actions are detected THEN the system SHALL add +40 to risk score

### Requirement 2
**User Story:** As a security-conscious reviewer, I want to detect broad permissions, so that I can enforce least-privilege.

#### Acceptance Criteria
1. WHEN a workflow has `permissions: write-all` THEN the system SHALL flag as BROAD_PERMISSIONS (critical)
2. WHEN a workflow has multiple write permissions THEN the system SHALL flag as BROAD_PERMISSIONS (critical)
3. WHEN broad permissions are detected THEN the system SHALL add +40 to risk score

### Requirement 3
**User Story:** As a security-conscious reviewer, I want to detect PR target attacks, so that I can prevent code execution vulnerabilities.

#### Acceptance Criteria
1. WHEN a workflow uses `pull_request_target` AND has write permissions THEN the system SHALL flag as PR_TARGET_WITH_WRITE (critical)
2. WHEN PR target attack is detected THEN the system SHALL add +40 to risk score
3. WHEN any workflow finding exists THEN the room band SHALL be at least "dark"
