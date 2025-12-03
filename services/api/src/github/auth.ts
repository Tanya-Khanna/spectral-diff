import type { Request, Response, NextFunction } from "express";

/**
 * Middleware to require and validate GitHub token from x-gh-token header.
 * 
 * Supports:
 * - Classic PATs: ghp_*, gho_*, ghu_*, ghs_*, ghr_*
 * - Fine-grained PATs: github_pat_*
 * - Optional "Bearer " prefix (stripped automatically)
 * 
 * Error responses:
 * - 401 MISSING_TOKEN: No x-gh-token header provided
 * - 401 INVALID_TOKEN_FORMAT: Token doesn't match expected format
 */
export function requireGhToken(req: Request, res: Response, next: NextFunction) {
  let token = String(req.header("x-gh-token") || "").trim();
  
  if (!token) {
    res.status(401).json({
      ok: false,
      error: {
        code: "MISSING_TOKEN",
        message: "Missing x-gh-token header. Provide a GitHub Personal Access Token.",
      },
    });
    return;
  }
  
  // Allow users to paste "Bearer <token>" - strip the prefix
  token = token.replace(/^Bearer\s+/i, "").trim();
  
  // Support classic + fine-grained PAT prefixes
  const validPrefixes = ["ghp_", "gho_", "ghu_", "ghs_", "ghr_", "github_pat_"];
  const hasValidPrefix = validPrefixes.some((p) => token.startsWith(p));
  
  // Heuristic only — GitHub will ultimately validate
  if (!hasValidPrefix && token.length < 40) {
    res.status(401).json({
      ok: false,
      error: {
        code: "INVALID_TOKEN_FORMAT",
        message: "Token format appears invalid. Paste a GitHub PAT (classic: ghp_* / fine-grained: github_pat_*).",
      },
    });
    return;
  }
  
  (req as any).ghToken = token;
  next();
}
