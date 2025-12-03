import { describe, it, expect } from "vitest";
import { lintWorkflowDiff, getWorkflowFindingLabel } from "../actionsLint";

describe("GitHub Actions Security Linter", () => {
  describe("Unpinned Actions Detection", () => {
    it("should detect unpinned action with version tag", () => {
      const diff = `+      - uses: actions/checkout@v3`;
      const findings = lintWorkflowDiff(diff);
      
      expect(findings.some(f => f.rule === "UNPINNED_ACTION")).toBe(true);
    });

    it("should detect unpinned action with @main", () => {
      const diff = `+      - uses: actions/setup-node@main`;
      const findings = lintWorkflowDiff(diff);
      
      expect(findings.some(f => f.rule === "UNPINNED_ACTION")).toBe(true);
    });

    it("should detect unpinned action with @master", () => {
      const diff = `+      - uses: some-org/dangerous-action@master`;
      const findings = lintWorkflowDiff(diff);
      
      expect(findings.some(f => f.rule === "UNPINNED_ACTION")).toBe(true);
    });

    it("should NOT flag SHA-pinned actions", () => {
      const diff = `+      - uses: actions/checkout@8ade135a41bc03ea155e62e844d188df1ea18608`;
      const findings = lintWorkflowDiff(diff);
      
      expect(findings.some(f => f.rule === "UNPINNED_ACTION")).toBe(false);
    });

    it("should NOT flag removed lines (starting with -)", () => {
      const diff = `-      - uses: actions/checkout@v3`;
      const findings = lintWorkflowDiff(diff);
      
      expect(findings.some(f => f.rule === "UNPINNED_ACTION")).toBe(false);
    });
  });

  describe("Broad Permissions Detection", () => {
    it("should detect write-all permissions", () => {
      const diff = `+permissions: write-all`;
      const findings = lintWorkflowDiff(diff);
      
      expect(findings.some(f => f.rule === "BROAD_PERMISSIONS")).toBe(true);
    });

    it("should NOT flag read permissions", () => {
      const diff = `+permissions:
+  contents: read`;
      const findings = lintWorkflowDiff(diff);
      
      expect(findings.some(f => 
        f.rule === "BROAD_PERMISSIONS" && f.evidence === "permissions: write-all"
      )).toBe(false);
    });
  });

  describe("pull_request_target with Write Permissions", () => {
    it("should detect PR target with write-all", () => {
      const diff = `+on:
+  pull_request_target:
+    branches: [main]
+
+permissions: write-all`;
      const findings = lintWorkflowDiff(diff);
      
      expect(findings.some(f => f.rule === "PR_TARGET_WITH_WRITE")).toBe(true);
    });

    it("should detect PR target with contents: write", () => {
      const diff = `+on:
+  pull_request_target:
+    branches: [main]
+
+permissions:
+  contents: write`;
      const findings = lintWorkflowDiff(diff);
      
      expect(findings.some(f => f.rule === "PR_TARGET_WITH_WRITE")).toBe(true);
    });

    it("should NOT flag pull_request_target with read-only permissions", () => {
      const diff = `+on:
+  pull_request_target:
+    branches: [main]
+
+permissions:
+  contents: read`;
      const findings = lintWorkflowDiff(diff);
      
      expect(findings.some(f => f.rule === "PR_TARGET_WITH_WRITE")).toBe(false);
    });

    it("should NOT flag regular pull_request trigger", () => {
      const diff = `+on:
+  pull_request:
+    branches: [main]
+
+permissions:
+  contents: write`;
      const findings = lintWorkflowDiff(diff);
      
      expect(findings.some(f => f.rule === "PR_TARGET_WITH_WRITE")).toBe(false);
    });
  });

  describe("Combined Findings", () => {
    it("should detect multiple issues in one workflow", () => {
      const diff = `+name: CI Pipeline
+
+on:
+  pull_request_target:
+    branches: [main]
+
+permissions: write-all
+
+jobs:
+  build:
+    runs-on: ubuntu-latest
+    steps:
+      - uses: actions/checkout@v3
+      - uses: actions/setup-node@main`;
      
      const findings = lintWorkflowDiff(diff);
      
      // Should find: unpinned actions (2), broad permissions, PR target with write
      expect(findings.filter(f => f.rule === "UNPINNED_ACTION").length).toBeGreaterThanOrEqual(2);
      expect(findings.some(f => f.rule === "BROAD_PERMISSIONS")).toBe(true);
      expect(findings.some(f => f.rule === "PR_TARGET_WITH_WRITE")).toBe(true);
    });
  });

  describe("Finding Labels", () => {
    it("should return correct label for UNPINNED_ACTION", () => {
      expect(getWorkflowFindingLabel("UNPINNED_ACTION")).toBe("Unpinned GitHub Action");
    });

    it("should return correct label for BROAD_PERMISSIONS", () => {
      expect(getWorkflowFindingLabel("BROAD_PERMISSIONS")).toBe("Broad workflow permissions");
    });

    it("should return correct label for PR_TARGET_WITH_WRITE", () => {
      expect(getWorkflowFindingLabel("PR_TARGET_WITH_WRITE")).toBe("pull_request_target with write permissions");
    });
  });
});
