export type GhConfig = { token: string };

// Custom error class for GitHub API errors
export class GitHubApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}

/**
 * Redact secrets from any string for safe logging.
 * Covers GitHub PATs, Bearer tokens, and other common patterns.
 */
export function redactToken(str: string): string {
  return str
    // GitHub PAT patterns (ghp_, gho_, ghu_, ghs_, ghr_) - allow underscore/dash in body
    .replace(/gh[pousr]_[a-zA-Z0-9_-]+/g, "gh*_[REDACTED]")
    // GitHub fine-grained PATs (github_pat_)
    .replace(/github_pat_[a-zA-Z0-9_-]+/g, "github_pat_[REDACTED]")
    // Bearer tokens in headers (must come before generic Authorization)
    .replace(/Bearer\s+[a-zA-Z0-9_*\[\].-]+/gi, "Bearer [REDACTED]")
    // x-gh-token header values
    .replace(/x-gh-token:\s*[^\s,]+/gi, "x-gh-token: [REDACTED]");
}

export async function ghFetch<T>(
  url: string,
  { token }: GhConfig,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers || {}),
      // Authorization always wins - prevents accidental override
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    // Never log the token
    const safeMessage = redactToken(text);
    throw new GitHubApiError(res.status, `GitHub API ${res.status}: ${safeMessage}`);
  }
  return res.json() as Promise<T>;
}

export function ghUrl(path: string) {
  return `https://api.github.com${path}`;
}
