import { FileChange, Hunk } from "./types";
import { GitHubFile, CheckRun } from "./github";

// Map GitHub file status to language
function getLanguage(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const langMap: Record<string, string> = {
    ts: "typescript",
    tsx: "tsx",
    js: "javascript",
    jsx: "jsx",
    py: "python",
    rb: "ruby",
    go: "go",
    rs: "rust",
    java: "java",
    kt: "kotlin",
    swift: "swift",
    css: "css",
    scss: "scss",
    html: "html",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    md: "markdown",
    sql: "sql",
    sh: "bash",
  };
  return langMap[ext] || "text";
}

// Parse GitHub patch into hunks
function parseHunks(patch: string | undefined, filename: string): Hunk[] {
  if (!patch) return [];
  
  const hunks: Hunk[] = [];
  const hunkRegex = /^@@\s+-(\d+)(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@(.*)$/gm;
  const lines = patch.split("\n");
  
  let currentHunk: { header: string; lines: string[]; startLine: number } | null = null;
  let hunkIndex = 0;
  
  for (const line of lines) {
    const match = line.match(/^@@\s+-(\d+)(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@(.*)$/);
    if (match) {
      // Save previous hunk
      if (currentHunk) {
        hunks.push(createHunk(currentHunk, filename, hunkIndex++));
      }
      currentHunk = {
        header: line,
        lines: [],
        startLine: parseInt(match[2], 10),
      };
    } else if (currentHunk) {
      currentHunk.lines.push(line);
    }
  }
  
  // Save last hunk
  if (currentHunk) {
    hunks.push(createHunk(currentHunk, filename, hunkIndex));
  }
  
  return hunks;
}

function createHunk(
  data: { header: string; lines: string[]; startLine: number },
  filename: string,
  index: number
): Hunk {
  const added = data.lines.filter((l) => l.startsWith("+")).length;
  const removed = data.lines.filter((l) => l.startsWith("-")).length;
  const modified = Math.min(added, removed);
  
  // Detect red flags in the diff
  const redFlags = detectRedFlags(data.lines, filename);
  
  return {
    id: `${filename}-h${index}`,
    header: data.header,
    added,
    removed,
    modified,
    importance: calculateImportance(added, removed, redFlags.length, filename),
    diffText: data.lines.join("\n"),
    redFlags,
    commentSuggestion: generateCommentSuggestion(redFlags),
    fixSnippet: "",
    testSuggestion: "",
    patchPreview: "",
  };
}


function detectRedFlags(lines: string[], filename: string): string[] {
  const flags: string[] = [];
  const content = lines.join("\n");
  
  // Security patterns
  if (/password|secret|api[_-]?key|token/i.test(content) && /=\s*['"][^'"]+['"]/i.test(content)) {
    flags.push("🔐 Potential hardcoded secret");
  }
  if (/eval\(|exec\(|Function\(/i.test(content)) {
    flags.push("🔥 Dynamic code execution detected");
  }
  if (/innerHTML\s*=/i.test(content)) {
    flags.push("⚠️ innerHTML assignment (XSS risk)");
  }
  
  // Code quality
  if (/TODO|FIXME|HACK|XXX/i.test(content)) {
    flags.push("🦴 TODO/FIXME comment found");
  }
  if (/console\.(log|debug|info)/i.test(content)) {
    flags.push("👻 Console statement in code");
  }
  if (/catch\s*\([^)]*\)\s*\{\s*\}/i.test(content)) {
    flags.push("⚠️ Empty catch block");
  }
  
  // Workflow security (for YAML files)
  if (filename.includes(".github/workflows")) {
    if (/pull_request_target/i.test(content)) {
      flags.push("💀 CRITICAL: pull_request_target trigger");
    }
    if (/permissions:\s*write-all/i.test(content)) {
      flags.push("💀 CRITICAL: write-all permissions");
    }
    if (/@(v\d+|main|master)\s*$/m.test(content)) {
      flags.push("🔓 Unpinned GitHub Action");
    }
  }
  
  return flags;
}

function calculateImportance(added: number, removed: number, flagCount: number, filename: string): number {
  let importance = 30; // Base
  
  // Size factor
  importance += Math.min((added + removed) * 0.5, 30);
  
  // Red flags
  importance += flagCount * 15;
  
  // Sensitive paths
  if (/auth|payment|crypto|secret|security/i.test(filename)) {
    importance += 20;
  }
  if (filename.includes(".github/workflows")) {
    importance += 25;
  }
  
  return Math.min(Math.round(importance), 100);
}

function generateCommentSuggestion(redFlags: string[]): string {
  if (redFlags.length === 0) {
    return "The spirits find no issues with this change.";
  }
  
  const suggestions: string[] = [];
  for (const flag of redFlags) {
    if (flag.includes("hardcoded secret")) {
      suggestions.push("Consider using environment variables for sensitive values.");
    }
    if (flag.includes("TODO")) {
      suggestions.push("This TODO may haunt future maintainers.");
    }
    if (flag.includes("pull_request_target")) {
      suggestions.push("This workflow trigger allows arbitrary code execution with write access.");
    }
    if (flag.includes("Unpinned")) {
      suggestions.push("Pin actions to full SHA for supply chain security.");
    }
  }
  
  return suggestions.length > 0 
    ? suggestions.join(" ") 
    : "Review the flagged issues carefully.";
}

// Check if path is sensitive
function isSensitivePath(path: string): boolean {
  const sensitivePatterns = [
    /^\.github\/workflows\//,
    /auth/i,
    /payment/i,
    /crypto/i,
    /secret/i,
    /security/i,
  ];
  return sensitivePatterns.some((p) => p.test(path));
}

// Calculate risk score for a file
function calculateRisk(
  file: GitHubFile,
  hunks: Hunk[],
  checksPassing: boolean,
  testsTouched: boolean
): number {
  let risk = 0;
  
  // CI checks failing: +35
  if (!checksPassing) risk += 35;
  
  // Sensitive path: +25
  if (isSensitivePath(file.filename)) risk += 25;
  
  // Large change (500+ LOC): +20
  if (file.changes >= 500) risk += 20;
  // Medium change (100-500 LOC): +10
  else if (file.changes >= 100) risk += 10;
  
  // No tests modified when code modified: +20
  if (!testsTouched && file.changes > 0) risk += 20;
  
  // Dependency file: +15
  if (/package\.json|package-lock\.json|yarn\.lock|pnpm-lock\.yaml/i.test(file.filename)) {
    risk += 15;
  }
  
  // Red flags from hunks
  const totalFlags = hunks.reduce((sum, h) => sum + h.redFlags.length, 0);
  risk += totalFlags * 5;
  
  // Workflow security issues
  if (file.filename.includes(".github/workflows")) {
    const criticalFlags = hunks.flatMap(h => h.redFlags).filter(f => f.includes("CRITICAL"));
    if (criticalFlags.length > 0) risk += 40;
  }
  
  return Math.min(risk, 100);
}

export function mapGitHubFilesToRooms(
  files: GitHubFile[],
  checkRuns: CheckRun[]
): FileChange[] {
  // Determine if checks are passing
  const allChecksPassing = checkRuns.length === 0 || 
    checkRuns.every(c => c.conclusion === "success" || c.conclusion === "skipped");
  
  // Check if any test files are modified
  const testFiles = files.filter(f => 
    /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(f.filename) ||
    f.filename.includes("__tests__")
  );
  const hasTestChanges = testFiles.length > 0;
  
  return files.map((file) => {
    const hunks = parseHunks(file.patch, file.filename);
    const isTestFile = /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(file.filename);
    
    return {
      path: file.filename,
      language: getLanguage(file.filename),
      risk: calculateRisk(file, hunks, allChecksPassing, hasTestChanges || isTestFile),
      locChanged: file.changes,
      testsTouched: isTestFile || hasTestChanges,
      checksPassing: allChecksPassing,
      hunks,
    };
  });
}
