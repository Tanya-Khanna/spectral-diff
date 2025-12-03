# GitHub PAT Authentication — Requirements

## Introduction
This feature enables users to connect their GitHub account via Personal Access Token (PAT) to interact with real PRs. The architecture follows a client-side token storage pattern where the Next.js client stores the PAT in localStorage and sends it to the API on every request via header. The API proxies to GitHub without persisting the token.

## Glossary
- **PAT**: Personal Access Token — a GitHub authentication credential
- **Lobby**: The main entry screen where users configure their GitHub connection
- **x-gh-token**: HTTP header used to pass the PAT from client to API
- **Rate Limit**: GitHub API quota information used to validate token

## Requirements

### Requirement 1
**User Story:** As a user, I want to enter my GitHub PAT and repository details in the Lobby, so that I can connect to real PRs for review.

#### Acceptance Criteria
1. WHEN the Lobby page loads THEN the system SHALL display a "Connect GitHub" box with PAT input (password field), owner field, and repo field
2. WHEN a user enters a PAT THEN the system SHALL mask the input as a password field
3. WHEN a user clicks "Test token" THEN the system SHALL validate the token against GitHub API
4. WHEN token validation succeeds THEN the system SHALL display the authenticated username and a success indicator
5. WHEN token validation fails THEN the system SHALL display an error message without storing the token

### Requirement 2
**User Story:** As a user, I want my GitHub credentials persisted locally, so that I don't have to re-enter them on every visit.

#### Acceptance Criteria
1. WHEN token validation succeeds THEN the system SHALL store gh_token in localStorage
2. WHEN token validation succeeds THEN the system SHALL store gh_owner in localStorage
3. WHEN token validation succeeds THEN the system SHALL store gh_repo in localStorage
4. WHEN the Lobby page loads with existing credentials THEN the system SHALL pre-fill the owner and repo fields
5. WHEN the Lobby page loads with existing token THEN the system SHALL display connection status without showing the token value

### Requirement 3
**User Story:** As a user, I want to disconnect my GitHub account, so that I can clear my credentials from the browser.

#### Acceptance Criteria
1. WHEN a user clicks "Disconnect" THEN the system SHALL remove gh_token from localStorage
2. WHEN a user clicks "Disconnect" THEN the system SHALL remove gh_owner from localStorage
3. WHEN a user clicks "Disconnect" THEN the system SHALL remove gh_repo from localStorage
4. WHEN disconnect completes THEN the system SHALL reset the UI to the initial "Connect GitHub" state

### Requirement 4
**User Story:** As a developer, I want the API to proxy GitHub requests securely, so that tokens are never persisted server-side.

#### Acceptance Criteria
1. WHEN the API receives a request with x-gh-token header THEN the system SHALL forward the token to GitHub API
2. WHEN the API receives GET /gh/me THEN the system SHALL return the authenticated user's username from GitHub
3. WHEN the API receives a request without x-gh-token header THEN the system SHALL return 401 Unauthorized
4. WHEN the GitHub API returns an error THEN the system SHALL forward the error status and message to the client
5. WHEN the API proxies a request THEN the system SHALL NOT persist the token to any storage

### Requirement 5
**User Story:** As a user, I want to see my GitHub rate limit status, so that I know my remaining API quota.

#### Acceptance Criteria
1. WHEN connected THEN the system SHALL display current rate limit remaining
2. WHEN rate limit is below 100 THEN the system SHALL display a warning indicator
3. WHEN rate limit data is fetched THEN the system SHALL show reset time for quota refresh
