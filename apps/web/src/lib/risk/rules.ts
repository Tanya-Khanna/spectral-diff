// Risk scoring weights and path classifiers

export const RISK_WEIGHTS = {
  CI_FAILING: 35,
  SENSITIVE_PATH: 25,
  LOC_MEDIUM: 10,    // 100-500 LOC
  LOC_LARGE: 20,     // 500+ LOC
  NO_TESTS: 20,
  HIGH_CHURN: 10,
  HIGH_COMPLEXITY: 10,
  DEPENDENCY_CHANGE: 15,
  WORKFLOW_INSECURITY: 40,
} as const;

export const LOC_THRESHOLDS = {
  MEDIUM: 100,
  LARGE: 500,
} as const;

export const CHURN_THRESHOLD = 70;

export const BAND_THRESHOLDS = {
  BRIGHT_MAX: 20,
  DIM_MAX: 50,
  DARK_MAX: 80,
  // 80+ is cursed
} as const;

// Sensitive path patterns
export const SENSITIVE_PATHS = [
  /^\.github\/workflows\//,
  /auth\//i,
  /payment/i,
  /permissions?/i,
  /security/i,
  /secrets?/i,
  /credentials?/i,
  /\.env/,
  /config\/.*secret/i,
] as const;

// Dependency file patterns
export const DEPENDENCY_FILES = [
  /package\.json$/,
  /package-lock\.json$/,
  /pnpm-lock\.yaml$/,
  /yarn\.lock$/,
  /Gemfile\.lock$/,
  /requirements\.txt$/,
  /Cargo\.lock$/,
  /go\.sum$/,
] as const;

// Workflow file pattern
export const WORKFLOW_PATH = /^\.github\/workflows\/.+\.ya?ml$/;

// Complexity indicators in diff text
export const COMPLEXITY_PATTERNS = [
  /\bif\s*\(/g,
  /\belse\s*{/g,
  /\bfor\s*\(/g,
  /\bwhile\s*\(/g,
  /\bswitch\s*\(/g,
  /\btry\s*{/g,
  /\bcatch\s*\(/g,
  /\?\s*.*\s*:/g,  // ternary
] as const;

export const COMPLEXITY_THRESHOLD = 5; // Number of complexity indicators to trigger

export function isSensitivePath(path: string): boolean {
  return SENSITIVE_PATHS.some(pattern => pattern.test(path));
}

export function isDependencyFile(path: string): boolean {
  return DEPENDENCY_FILES.some(pattern => pattern.test(path));
}

export function isWorkflowFile(path: string): boolean {
  return WORKFLOW_PATH.test(path);
}
