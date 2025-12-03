import { describe, it, expect } from "vitest";
import { computeRoomRisk } from "../score";
import { FileChange } from "../../types";

// Helper to create a minimal file for testing
function createTestFile(overrides: Partial<FileChange> = {}): FileChange {
  return {
    path: "src/test.ts",
    language: "typescript",
    risk: 0,
    locChanged: 50,
    testsTouched: true,
    checksPassing: true,
    hunks: [],
    ...overrides,
  };
}

const mockPR = {
  files: [] as FileChange[],
};

describe("Risk Scoring Engine", () => {
  describe("CI Checks Failing (+35)", () => {
    it("should add 35 points when CI is failing", () => {
      const file = createTestFile({ checksPassing: false });
      const result = computeRoomRisk(file, mockPR);
      
      expect(result.score).toBeGreaterThanOrEqual(35);
      expect(result.signals.some(s => s.key === "ci_failing")).toBe(true);
      expect(result.criticalFindings).toContain("CI pipeline is failing");
    });

    it("should not add points when CI is passing", () => {
      const file = createTestFile({ checksPassing: true });
      const result = computeRoomRisk(file, mockPR);
      
      expect(result.signals.some(s => s.key === "ci_failing")).toBe(false);
    });
  });

  describe("Sensitive Paths (+25)", () => {
    it.each([
      "src/auth/login.ts",
      "src/payments/processor.ts",
      ".github/workflows/ci.yml",
    ])("should add 25 points for sensitive path: %s", (path) => {
      const file = createTestFile({ path, testsTouched: true });
      const result = computeRoomRisk(file, mockPR);
      
      expect(result.signals.some(s => s.key === "sensitive_path")).toBe(true);
    });

    it("should not flag non-sensitive paths", () => {
      const file = createTestFile({ path: "src/components/Button.tsx" });
      const result = computeRoomRisk(file, mockPR);
      
      expect(result.signals.some(s => s.key === "sensitive_path")).toBe(false);
    });
  });

  describe("LOC Thresholds", () => {
    it("should add 20 points for large changes (500+ LOC)", () => {
      const file = createTestFile({ locChanged: 600 });
      const result = computeRoomRisk(file, mockPR);
      
      expect(result.signals.some(s => s.key === "loc_large")).toBe(true);
      expect(result.signals.find(s => s.key === "loc_large")?.points).toBe(20);
    });

    it("should add 10 points for medium changes (100-499 LOC)", () => {
      const file = createTestFile({ locChanged: 250 });
      const result = computeRoomRisk(file, mockPR);
      
      expect(result.signals.some(s => s.key === "loc_medium")).toBe(true);
      expect(result.signals.find(s => s.key === "loc_medium")?.points).toBe(10);
    });

    it("should not add points for small changes (<100 LOC)", () => {
      const file = createTestFile({ locChanged: 50 });
      const result = computeRoomRisk(file, mockPR);
      
      expect(result.signals.some(s => s.key === "loc_large")).toBe(false);
      expect(result.signals.some(s => s.key === "loc_medium")).toBe(false);
    });
  });

  describe("No Tests Modified (+20)", () => {
    it("should add 20 points when code modified without tests", () => {
      const file = createTestFile({ testsTouched: false, path: "src/utils.ts" });
      const result = computeRoomRisk(file, mockPR);
      
      expect(result.signals.some(s => s.key === "no_tests")).toBe(true);
    });

    it("should not flag when tests are touched", () => {
      const file = createTestFile({ testsTouched: true });
      const result = computeRoomRisk(file, mockPR);
      
      expect(result.signals.some(s => s.key === "no_tests")).toBe(false);
    });
  });

  describe("Dependency Files (+15)", () => {
    it.each([
      "package.json",
      "package-lock.json",
      "yarn.lock",
      "pnpm-lock.yaml",
    ])("should add 15 points for dependency file: %s", (path) => {
      const file = createTestFile({ path });
      const result = computeRoomRisk(file, mockPR);
      
      expect(result.signals.some(s => s.key === "dependency_change")).toBe(true);
    });
  });

  describe("Risk Bands", () => {
    it("should return 'bright' band for score 0-20", () => {
      const file = createTestFile({ locChanged: 10, testsTouched: true });
      const result = computeRoomRisk(file, mockPR);
      
      expect(result.band).toBe("bright");
    });

    it("should return 'cursed' band for score 80+", () => {
      const file = createTestFile({
        checksPassing: false, // +35
        path: "src/auth/login.ts", // +25
        locChanged: 600, // +20
        testsTouched: false, // +20
      });
      const result = computeRoomRisk(file, mockPR);
      
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.band).toBe("cursed");
    });
  });

  describe("Score Capping", () => {
    it("should cap score at 100", () => {
      const file = createTestFile({
        checksPassing: false, // +35
        path: ".github/workflows/ci.yml", // +25 sensitive + workflow
        locChanged: 600, // +20
        testsTouched: false, // +20
        isHighChurn: true, // +10
        hunks: [{
          id: "h1",
          header: "",
          added: 10,
          removed: 5,
          modified: 5,
          importance: 50,
          diffText: `+permissions: write-all
+on: pull_request_target
+uses: actions/checkout@v3`,
          redFlags: [],
          commentSuggestion: "",
          fixSnippet: "",
          testSuggestion: "",
          patchPreview: "",
        }],
      });
      const result = computeRoomRisk(file, mockPR);
      
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });
});
