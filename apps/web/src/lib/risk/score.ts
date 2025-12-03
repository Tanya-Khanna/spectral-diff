// Main risk scoring function

import { FileChange } from "../types";

// Minimal interface for PR data needed by risk engine
interface PRData {
  files: FileChange[];
}
import { RoomRiskResult, RiskSignal, WorkflowFinding } from "./types";
import {
  RISK_WEIGHTS,
  LOC_THRESHOLDS,
  CHURN_THRESHOLD,
  BAND_THRESHOLDS,
  COMPLEXITY_PATTERNS,
  COMPLEXITY_THRESHOLD,
  isSensitivePath,
  isDependencyFile,
  isWorkflowFile,
} from "./rules";
import { lintWorkflowDiff, getWorkflowFindingLabel } from "./actionsLint";

/**
 * Compute risk score for a single file/room
 */
export function computeRoomRisk(file: FileChange, _pr?: PRData): RoomRiskResult {
  const signals: RiskSignal[] = [];
  const criticalFindings: string[] = [];
  const notes: string[] = [];
  let score = 0;

  // 1. CI checks failing: +35
  if (!file.checksPassing) {
    score += RISK_WEIGHTS.CI_FAILING;
    signals.push({
      key: "ci_failing",
      label: "CI checks failing",
      points: RISK_WEIGHTS.CI_FAILING,
      severity: "critical",
    });
    criticalFindings.push("CI pipeline is failing");
  }

  // 2. Sensitive paths: +25
  if (isSensitivePath(file.path)) {
    score += RISK_WEIGHTS.SENSITIVE_PATH;
    signals.push({
      key: "sensitive_path",
      label: "Touches sensitive path",
      points: RISK_WEIGHTS.SENSITIVE_PATH,
      severity: "warn",
    });
    notes.push(`Sensitive path: ${file.path}`);
  }

  // 3. LOC thresholds: +0/+10/+20
  if (file.locChanged >= LOC_THRESHOLDS.LARGE) {
    score += RISK_WEIGHTS.LOC_LARGE;
    signals.push({
      key: "loc_large",
      label: `Large change (${file.locChanged} LOC)`,
      points: RISK_WEIGHTS.LOC_LARGE,
      severity: "warn",
    });
  } else if (file.locChanged >= LOC_THRESHOLDS.MEDIUM) {
    score += RISK_WEIGHTS.LOC_MEDIUM;
    signals.push({
      key: "loc_medium",
      label: `Medium change (${file.locChanged} LOC)`,
      points: RISK_WEIGHTS.LOC_MEDIUM,
      severity: "info",
    });
  }

  // 4. No tests modified when code modified: +20
  if (!file.testsTouched && isCodeFile(file.path)) {
    score += RISK_WEIGHTS.NO_TESTS;
    signals.push({
      key: "no_tests",
      label: "No tests modified",
      points: RISK_WEIGHTS.NO_TESTS,
      severity: "warn",
    });
  }

  // 5. High churn file: +10
  const churnScore = file.churnScore ?? (file.isHighChurn ? CHURN_THRESHOLD : 0);
  if (churnScore >= CHURN_THRESHOLD || file.isHighChurn) {
    score += RISK_WEIGHTS.HIGH_CHURN;
    signals.push({
      key: "high_churn",
      label: "High churn file",
      points: RISK_WEIGHTS.HIGH_CHURN,
      severity: "info",
    });
    notes.push("This file changes frequently");
  }

  // 6. Complexity estimate: +10
  const complexityCount = estimateComplexity(file);
  if (complexityCount >= COMPLEXITY_THRESHOLD) {
    score += RISK_WEIGHTS.HIGH_COMPLEXITY;
    signals.push({
      key: "high_complexity",
      label: `High complexity (${complexityCount} indicators)`,
      points: RISK_WEIGHTS.HIGH_COMPLEXITY,
      severity: "info",
    });
  }

  // 7. Dependency changes: +15
  if (isDependencyFile(file.path)) {
    score += RISK_WEIGHTS.DEPENDENCY_CHANGE;
    signals.push({
      key: "dependency_change",
      label: "Dependency file changed",
      points: RISK_WEIGHTS.DEPENDENCY_CHANGE,
      severity: "warn",
    });
    notes.push("Review dependency changes carefully");
  }

  // 8. Workflow security lint: +40 (Critical)
  let workflowFindings: WorkflowFinding[] = [];
  if (isWorkflowFile(file.path)) {
    const allDiffText = file.hunks.map(h => h.diffText).join("\n");
    workflowFindings = lintWorkflowDiff(allDiffText);
    
    if (workflowFindings.length > 0) {
      score += RISK_WEIGHTS.WORKFLOW_INSECURITY;
      signals.push({
        key: "workflow_insecurity",
        label: `Workflow security issues (${workflowFindings.length})`,
        points: RISK_WEIGHTS.WORKFLOW_INSECURITY,
        severity: "critical",
      });
      
      for (const finding of workflowFindings) {
        criticalFindings.push(getWorkflowFindingLabel(finding.rule));
        if (finding.evidence) {
          notes.push(`Evidence: ${finding.evidence}`);
        }
      }
    }
  }

  // Cap at 100
  score = Math.min(score, 100);

  // Determine band
  let band = determineBand(score);
  
  // If workflow insecurity, ensure at least "dark"
  if (workflowFindings.length > 0 && (band === "bright" || band === "dim")) {
    band = "dark";
  }

  return {
    score,
    band,
    signals,
    criticalFindings,
    notes,
  };
}

/**
 * Determine risk band from score
 */
function determineBand(score: number): RoomRiskResult["band"] {
  if (score <= BAND_THRESHOLDS.BRIGHT_MAX) return "bright";
  if (score <= BAND_THRESHOLDS.DIM_MAX) return "dim";
  if (score <= BAND_THRESHOLDS.DARK_MAX) return "dark";
  return "cursed";
}

/**
 * Estimate complexity from diff hunks
 */
function estimateComplexity(file: FileChange): number {
  let count = 0;
  const allDiffText = file.hunks.map(h => h.diffText).join("\n");
  
  for (const pattern of COMPLEXITY_PATTERNS) {
    const matches = allDiffText.match(pattern);
    if (matches) {
      count += matches.length;
    }
  }
  
  return count;
}

/**
 * Check if file is a code file (not config, docs, etc.)
 */
function isCodeFile(path: string): boolean {
  const codeExtensions = [
    ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
    ".py", ".rb", ".go", ".rs", ".java", ".kt",
    ".c", ".cpp", ".h", ".hpp", ".cs", ".swift",
  ];
  return codeExtensions.some(ext => path.endsWith(ext));
}

/**
 * Compute risk for all files and sort by risk (highest first)
 */
export function computeAllRisks(pr: PRData): Array<{ file: FileChange; risk: RoomRiskResult }> {
  return pr.files
    .map(file => ({
      file,
      risk: computeRoomRisk(file, pr),
    }))
    .sort((a, b) => b.risk.score - a.risk.score);
}
