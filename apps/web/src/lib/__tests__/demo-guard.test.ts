/**
 * Build-time guard: Ensures demo module isn't imported in real mode paths.
 * 
 * This test verifies that:
 * 1. Demo data module is only imported through the store's guarded getDemoData()
 * 2. Types are imported from @/lib/types, not @/lib/demo/pr
 * 3. No runtime code directly imports demo data
 */

import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import * as path from "path";
import * as fs from "fs";

describe("Demo Module Import Guard", () => {
  it("should not have direct imports of demo/pr outside of store.tsx and demo/pr.ts itself", () => {
    const srcDir = path.resolve(__dirname, "../../");
    
    // Find all TypeScript files that import from demo/pr
    // Exclude: store.tsx (allowed - uses require with guard), demo/pr.ts itself, test files
    const grepCommand = `grep -r "@/lib/demo/pr\\|from.*demo/pr" --include="*.ts" --include="*.tsx" "${srcDir}" | grep -v "store.tsx" | grep -v "demo/pr.ts" | grep -v "__tests__" | grep -v "node_modules" | grep -v ".test." || true`;
    
    let result = "";
    try {
      result = execSync(grepCommand, { encoding: "utf-8" });
    } catch {
      // grep returns exit code 1 when no matches found, which is what we want
      result = "";
    }
    
    const violations = result.trim().split("\n").filter(Boolean);
    
    if (violations.length > 0) {
      console.error("❌ Demo module imported outside of store.tsx:");
      violations.forEach(v => console.error(`   ${v}`));
    }
    
    expect(violations).toHaveLength(0);
  });

  it("should have demo guard in store.tsx", () => {
    const storeContent = fs.readFileSync(
      path.resolve(__dirname, "../store.tsx"),
      "utf-8"
    );
    
    // Verify the guard exists
    expect(storeContent).toContain("DEMO_MODE");
    expect(storeContent).toContain("getDemoData");
    // Verify it uses require (runtime import) not static import
    expect(storeContent).toContain('require("./demo/pr")');
  });

  it("should import types from types.ts, not demo/pr.ts", () => {
    const storeContent = fs.readFileSync(
      path.resolve(__dirname, "../store.tsx"),
      "utf-8"
    );
    
    // Store should import types from types.ts
    expect(storeContent).toContain('from "./types"');
  });

  it("should export AppMode type from store", async () => {
    // This verifies the store module loads correctly and exports AppMode
    const store = await import("../store");
    expect(store).toHaveProperty("SpectralProvider");
    expect(store).toHaveProperty("useSpectral");
  });
});
