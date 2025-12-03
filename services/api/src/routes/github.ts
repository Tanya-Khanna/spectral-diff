import { Router, Response } from "express";
import { z } from "zod";
import { requireGhToken } from "../github/auth";
import { ghFetch, ghUrl, GitHubApiError } from "../github/client";

export const githubRouter = Router();
githubRouter.use(requireGhToken);

// Standardized error response
interface ApiError {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

function apiError(code: string, message: string, details?: unknown): ApiError {
  return { ok: false, error: { code, message, details } };
}

// Error handler middleware
function handleError(err: unknown, res: Response) {
  if (err instanceof GitHubApiError) {
    const status = err.status;
    if (status === 401) {
      return res.status(401).json(apiError("UNAUTHORIZED", "Invalid or expired token"));
    }
    if (status === 403) {
      // Better rate limit detection (case-insensitive)
      if (/rate limit/i.test(err.message)) {
        return res.status(403).json(apiError("RATE_LIMITED", "GitHub API rate limit exceeded"));
      }
      return res.status(403).json(apiError("FORBIDDEN", "Insufficient permissions or bad scopes"));
    }
    if (status === 404) {
      return res.status(404).json(apiError("NOT_FOUND", "Resource not found"));
    }
    return res.status(status).json(apiError("GITHUB_ERROR", err.message));
  }
  
  if (err instanceof z.ZodError) {
    return res.status(400).json(apiError("VALIDATION_ERROR", "Invalid request parameters", err.issues));
  }
  
  const message = err instanceof Error ? err.message : "Unknown error";
  console.error("[API] Unhandled error:", message);
  return res.status(500).json(apiError("INTERNAL_ERROR", message));
}

// Zod schemas for validation
const OwnerRepoSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
});

const PullsQuerySchema = OwnerRepoSchema.extend({
  state: z.enum(["open", "closed", "all"]).optional().default("open"),
});

// Review body validation: require body for REQUEST_CHANGES and COMMENT
const ReviewBodySchema = z.discriminatedUnion("event", [
  z.object({ event: z.literal("APPROVE"), body: z.string().optional() }),
  z.object({ event: z.literal("COMMENT"), body: z.string().min(1) }),
  z.object({ event: z.literal("REQUEST_CHANGES"), body: z.string().min(1) }),
]);

const CommentBodySchema = z.object({
  body: z.string().min(1),
});

// Apply patch: enforce single file only (product rule)
const ApplyPatchBodySchema = z.object({
  headRef: z.string().min(1),
  headSha: z.string().length(40),
  commitMessage: z.string().min(1),
  fileEdits: z.array(z.object({
    path: z.string().min(1),
    content: z.string(),
  })).length(1, { message: "Only single-file patches are supported" }),
});

// GET /gh/me - Get authenticated user
githubRouter.get("/me", async (req, res) => {
  try {
    const token = (req as any).ghToken as string;
    const [me, rateLimit] = await Promise.all([
      ghFetch<any>(ghUrl("/user"), { token }),
      ghFetch<any>(ghUrl("/rate_limit"), { token }),
    ]);
    res.json({
      ok: true,
      data: {
        username: me.login,
        avatarUrl: me.avatar_url,
        rateLimit: {
          remaining: rateLimit.rate.remaining,
          limit: rateLimit.rate.limit,
          reset: new Date(rateLimit.rate.reset * 1000).toISOString(),
        },
      },
    });
  } catch (err) {
    handleError(err, res);
  }
});

// GET /gh/rate_limit - Get rate limit status
githubRouter.get("/rate_limit", async (req, res) => {
  try {
    const token = (req as any).ghToken as string;
    const rawData = await ghFetch<any>(ghUrl("/rate_limit"), { token });
    res.json({
      ok: true,
      data: {
        remaining: rawData.rate.remaining,
        limit: rawData.rate.limit,
        reset: new Date(rawData.rate.reset * 1000).toISOString(),
      },
    });
  } catch (err) {
    handleError(err, res);
  }
});

// GET /gh/pulls - List open PRs
githubRouter.get("/pulls", async (req, res) => {
  try {
    const token = (req as any).ghToken as string;
    const { owner, repo, state } = PullsQuerySchema.parse(req.query);
    const data = await ghFetch<unknown[]>(
      ghUrl(`/repos/${owner}/${repo}/pulls?state=${state}`),
      { token }
    );
    res.json({ ok: true, data });
  } catch (err) {
    handleError(err, res);
  }
});

// GET /gh/pulls/:number/files - Get PR files with diffs
githubRouter.get("/pulls/:number/files", async (req, res) => {
  try {
    const token = (req as any).ghToken as string;
    const { owner, repo } = OwnerRepoSchema.parse(req.query);
    const prNumber = z.coerce.number().parse(req.params.number);
    const data = await ghFetch<unknown[]>(
      ghUrl(`/repos/${owner}/${repo}/pulls/${prNumber}/files`),
      { token }
    );
    res.json({ ok: true, data });
  } catch (err) {
    handleError(err, res);
  }
});

// GET /gh/pulls/:number/meta - Get PR metadata (head SHA, refs)
githubRouter.get("/pulls/:number/meta", async (req, res) => {
  try {
    const token = (req as any).ghToken as string;
    const { owner, repo } = OwnerRepoSchema.parse(req.query);
    const number = z.coerce.number().parse(req.params.number);
    const pr = await ghFetch<any>(
      ghUrl(`/repos/${owner}/${repo}/pulls/${number}`),
      { token }
    );
    res.json({
      ok: true,
      data: {
        number: pr.number,
        headSha: pr.head?.sha,
        headRef: pr.head?.ref,
        baseRef: pr.base?.ref,
        title: pr.title,
        body: pr.body,
        user: pr.user?.login,
        state: pr.state,
      },
    });
  } catch (err) {
    handleError(err, res);
  }
});

// GET /gh/pulls/:number/checks - Get check runs for PR
githubRouter.get("/pulls/:number/checks", async (req, res) => {
  try {
    const token = (req as any).ghToken as string;
    const { owner, repo } = OwnerRepoSchema.parse(req.query);
    const ref = z.string().min(1).parse(req.query.ref);
    const data = await ghFetch(
      ghUrl(`/repos/${owner}/${repo}/commits/${ref}/check-runs`),
      { token },
      {
        // GitHub Checks API requires explicit Accept header
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );
    // Wrap in consistent envelope
    res.json({ ok: true, data });
  } catch (err) {
    handleError(err, res);
  }
});

// POST /gh/pulls/:number/review - Submit PR review
githubRouter.post("/pulls/:number/review", async (req, res) => {
  try {
    const token = (req as any).ghToken as string;
    const { owner, repo } = OwnerRepoSchema.parse(req.query);
    const number = z.coerce.number().parse(req.params.number);
    const { event, body } = ReviewBodySchema.parse(req.body);

    const out = await ghFetch<Record<string, unknown>>(
      ghUrl(`/repos/${owner}/${repo}/pulls/${number}/reviews`),
      { token },
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, body }),
      }
    );
    res.json({ ok: true, data: out });
  } catch (err) {
    handleError(err, res);
  }
});

// POST /gh/pulls/:number/comment - Post general comment on PR
githubRouter.post("/pulls/:number/comment", async (req, res) => {
  try {
    const token = (req as any).ghToken as string;
    const { owner, repo } = OwnerRepoSchema.parse(req.query);
    const number = z.coerce.number().parse(req.params.number);
    const { body } = CommentBodySchema.parse(req.body);

    const out = await ghFetch<Record<string, unknown>>(
      ghUrl(`/repos/${owner}/${repo}/issues/${number}/comments`),
      { token },
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      }
    );
    res.json({ ok: true, data: out });
  } catch (err) {
    handleError(err, res);
  }
});

// POST /gh/pulls/:number/apply-patch - Apply patch via Git Data API
githubRouter.post("/pulls/:number/apply-patch", async (req, res) => {
  try {
    const token = (req as any).ghToken as string;
    const { owner, repo } = OwnerRepoSchema.parse(req.query);
    const prNumber = z.coerce.number().parse(req.params.number);
    const { headRef, headSha, commitMessage, fileEdits } = ApplyPatchBodySchema.parse(req.body);
    
    // Log for audit trail (prNumber used for traceability)
    console.log(`[apply-patch] PR #${prNumber} on ${owner}/${repo}`);

    // 1. Create blobs for each file
    const blobShas: Array<{ path: string; sha: string }> = [];
    for (const edit of fileEdits) {
      const blob = await ghFetch<any>(
        ghUrl(`/repos/${owner}/${repo}/git/blobs`),
        { token },
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: edit.content,
            encoding: "utf-8",
          }),
        }
      );
      blobShas.push({ path: edit.path, sha: blob.sha });
    }

    // 2. Get the base tree from head commit
    const headCommit = await ghFetch<any>(
      ghUrl(`/repos/${owner}/${repo}/git/commits/${headSha}`),
      { token }
    );
    const baseTreeSha = headCommit.tree.sha;

    // 3. Create new tree with file changes
    const tree = await ghFetch<any>(
      ghUrl(`/repos/${owner}/${repo}/git/trees`),
      { token },
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: blobShas.map((b) => ({
            path: b.path,
            mode: "100644",
            type: "blob",
            sha: b.sha,
          })),
        }),
      }
    );

    // 4. Create commit
    const commit = await ghFetch<any>(
      ghUrl(`/repos/${owner}/${repo}/git/commits`),
      { token },
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: commitMessage,
          tree: tree.sha,
          parents: [headSha],
        }),
      }
    );

    // 5. Update ref (push)
    await ghFetch(
      ghUrl(`/repos/${owner}/${repo}/git/refs/heads/${headRef}`),
      { token },
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sha: commit.sha,
          force: false,
        }),
      }
    );

    res.json({
      ok: true,
      data: {
        commitSha: commit.sha,
        message: commitMessage,
      },
    });
  } catch (err) {
    handleError(err, res);
  }
});
