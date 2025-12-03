// GitHub Actions workflow security linter

import { WorkflowFinding } from "./types";

// Regex patterns for workflow security issues

// Unpinned actions: uses: owner/repo@v3, @main, @master (not SHA)
// SHA pins are 40 hex characters (case-insensitive)
// This pattern flags anything that's NOT a 40-char hex SHA
const UNPINNED_ACTION_PATTERN = /uses:\s*[\w\-\.]+\/[\w\-\.]+@(?![a-fA-F0-9]{40}\b)([\w\-\.]+)/gi;

// Broad permissions patterns
const WRITE_ALL_PATTERN = /permissions:\s*write-all/i;
const BROAD_WRITE_PATTERN = /permissions:\s*\n(\s+[\w-]+:\s*write\s*\n){2,}/i;
const CONTENTS_WRITE_PATTERN = /contents:\s*write/i;
const PACKAGES_WRITE_PATTERN = /packages:\s*write/i;
const ACTIONS_WRITE_PATTERN = /actions:\s*write/i;

// pull_request_target detection
const PR_TARGET_PATTERN = /pull_request_target/i;

/**
 * Lint workflow diff text for security issues
 */
export function lintWorkflowDiff(diffText: string): WorkflowFinding[] {
  const findings: WorkflowFinding[] = [];
  
  // Check for unpinned actions
  const unpinnedMatches = diffText.matchAll(UNPINNED_ACTION_PATTERN);
  for (const match of unpinnedMatches) {
    // Only flag added lines (starting with +)
    const lineContext = getLineContext(diffText, match.index ?? 0);
    if (lineContext.startsWith("+")) {
      findings.push({
        rule: "UNPINNED_ACTION",
        severity: "critical",
        message: "Unpinned GitHub Action detected. Pin to a specific SHA for security.",
        evidence: match[0].trim(),
      });
    }
  }
  
  // Check for broad permissions
  if (WRITE_ALL_PATTERN.test(diffText)) {
    const lineContext = findPatternInAddedLines(diffText, WRITE_ALL_PATTERN);
    if (lineContext) {
      findings.push({
        rule: "BROAD_PERMISSIONS",
        severity: "critical",
        message: "Workflow has write-all permissions. Use minimal required permissions.",
        evidence: "permissions: write-all",
      });
    }
  }
  
  // Check for multiple write permissions
  if (BROAD_WRITE_PATTERN.test(diffText)) {
    findings.push({
      rule: "BROAD_PERMISSIONS",
      severity: "critical",
      message: "Workflow has multiple write permissions. Review if all are necessary.",
    });
  }
  
  // Check for pull_request_target with write permissions
  const hasPRTarget = PR_TARGET_PATTERN.test(diffText);
  const hasWritePermission = 
    CONTENTS_WRITE_PATTERN.test(diffText) ||
    PACKAGES_WRITE_PATTERN.test(diffText) ||
    ACTIONS_WRITE_PATTERN.test(diffText) ||
    WRITE_ALL_PATTERN.test(diffText);
  
  if (hasPRTarget && hasWritePermission) {
    findings.push({
      rule: "PR_TARGET_WITH_WRITE",
      severity: "critical",
      message: "pull_request_target with write permissions is dangerous. Attacker PRs can execute arbitrary code with write access.",
      evidence: "pull_request_target + write permissions",
    });
  }
  
  return findings;
}

/**
 * Get the line containing the match
 */
function getLineContext(text: string, index: number): string {
  const start = text.lastIndexOf("\n", index) + 1;
  const end = text.indexOf("\n", index);
  return text.slice(start, end === -1 ? undefined : end);
}

/**
 * Check if pattern exists in added lines (lines starting with +)
 */
function findPatternInAddedLines(diffText: string, pattern: RegExp): string | null {
  const lines = diffText.split("\n");
  for (const line of lines) {
    if (line.startsWith("+") && pattern.test(line)) {
      return line;
    }
  }
  return null;
}

/**
 * Get human-readable finding message
 */
export function getWorkflowFindingLabel(rule: WorkflowFinding["rule"]): string {
  switch (rule) {
    case "UNPINNED_ACTION":
      return "Unpinned GitHub Action";
    case "BROAD_PERMISSIONS":
      return "Broad workflow permissions";
    case "PR_TARGET_WITH_WRITE":
      return "pull_request_target with write permissions";
  }
}
