import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import after mocking
import { ghFetch, ghUrl, GitHubApiError, redactToken } from "../src/github/client";

describe("GitHub Client", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("ghUrl", () => {
    it("should construct GitHub API URL", () => {
      expect(ghUrl("/user")).toBe("https://api.github.com/user");
      expect(ghUrl("/repos/owner/repo/pulls")).toBe("https://api.github.com/repos/owner/repo/pulls");
    });
  });

  describe("ghFetch", () => {
    it("should include correct headers", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ login: "testuser" }),
      });

      await ghFetch(ghUrl("/user"), { token: "test-token" });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.github.com/user",
        expect.objectContaining({
          headers: expect.objectContaining({
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            Authorization: "Bearer test-token",
          }),
        })
      );
    });

    it("should throw on non-ok response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Bad credentials"),
      });

      await expect(ghFetch(ghUrl("/user"), { token: "bad-token" })).rejects.toThrow(
        "GitHub API 401: Bad credentials"
      );
    });

    it("should return JSON on success", async () => {
      const mockData = { login: "testuser", id: 123 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await ghFetch(ghUrl("/user"), { token: "test-token" });
      expect(result).toEqual(mockData);
    });
  });
});

describe("GitHub API Endpoints (Mocked)", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("GET /user (via ghFetch)", () => {
    it("should return user data", async () => {
      const mockUser = {
        login: "octocat",
        avatar_url: "https://github.com/images/octocat.png",
        id: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
      });

      const result = await ghFetch<typeof mockUser>(ghUrl("/user"), { token: "test-token" });
      
      expect(result.login).toBe("octocat");
      expect(result.avatar_url).toBeDefined();
    });
  });

  describe("GET /repos/:owner/:repo/pulls", () => {
    it("should return list of PRs", async () => {
      const mockPRs = [
        { number: 1, title: "First PR", state: "open" },
        { number: 2, title: "Second PR", state: "open" },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPRs),
      });

      const result = await ghFetch<typeof mockPRs>(
        ghUrl("/repos/owner/repo/pulls?state=open"),
        { token: "test-token" }
      );

      expect(result).toHaveLength(2);
      expect(result[0].number).toBe(1);
    });
  });

  describe("GET /repos/:owner/:repo/pulls/:number/files", () => {
    it("should return PR files with patches", async () => {
      const mockFiles = [
        {
          filename: "src/index.ts",
          status: "modified",
          additions: 10,
          deletions: 5,
          patch: "@@ -1,5 +1,10 @@\n+new line",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockFiles),
      });

      const result = await ghFetch<typeof mockFiles>(
        ghUrl("/repos/owner/repo/pulls/1/files"),
        { token: "test-token" }
      );

      expect(result[0].filename).toBe("src/index.ts");
      expect(result[0].patch).toContain("+new line");
    });
  });

  describe("GET /repos/:owner/:repo/commits/:ref/check-runs", () => {
    it("should return check runs", async () => {
      const mockChecks = {
        total_count: 2,
        check_runs: [
          { id: 1, name: "build", status: "completed", conclusion: "success" },
          { id: 2, name: "test", status: "completed", conclusion: "success" },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockChecks),
      });

      const result = await ghFetch<typeof mockChecks>(
        ghUrl("/repos/owner/repo/commits/abc123/check-runs"),
        { token: "test-token" }
      );

      expect(result.total_count).toBe(2);
      expect(result.check_runs[0].conclusion).toBe("success");
    });
  });

  describe("POST /repos/:owner/:repo/pulls/:number/reviews", () => {
    it("should create a review", async () => {
      const mockReview = {
        id: 1,
        state: "APPROVED",
        body: "LGTM!",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockReview),
      });

      const result = await ghFetch<typeof mockReview>(
        ghUrl("/repos/owner/repo/pulls/1/reviews"),
        { token: "test-token" },
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event: "APPROVE", body: "LGTM!" }),
        }
      );

      expect(result.state).toBe("APPROVED");
    });
  });
});


describe("Error Handling", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("401 Unauthorized", () => {
    it("should throw GitHubApiError with status 401 for bad credentials", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Bad credentials"),
      });

      try {
        await ghFetch(ghUrl("/user"), { token: "bad-token" });
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(GitHubApiError);
        expect((err as GitHubApiError).status).toBe(401);
        expect((err as GitHubApiError).message).toContain("401");
      }
    });
  });

  describe("403 Forbidden", () => {
    it("should throw GitHubApiError with status 403 for rate limit", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: () => Promise.resolve("API rate limit exceeded"),
      });

      try {
        await ghFetch(ghUrl("/user"), { token: "test-token" });
      } catch (err) {
        expect(err).toBeInstanceOf(GitHubApiError);
        expect((err as GitHubApiError).status).toBe(403);
        expect((err as GitHubApiError).message).toContain("rate limit");
      }
    });

    it("should throw GitHubApiError with status 403 for insufficient scopes", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: () => Promise.resolve("Resource not accessible by integration"),
      });

      try {
        await ghFetch(ghUrl("/repos/owner/repo/pulls"), { token: "test-token" });
      } catch (err) {
        expect(err).toBeInstanceOf(GitHubApiError);
        expect((err as GitHubApiError).status).toBe(403);
      }
    });
  });

  describe("404 Not Found", () => {
    it("should throw GitHubApiError with status 404 for missing repo", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () => Promise.resolve("Not Found"),
      });

      try {
        await ghFetch(ghUrl("/repos/nonexistent/repo"), { token: "test-token" });
      } catch (err) {
        expect(err).toBeInstanceOf(GitHubApiError);
        expect((err as GitHubApiError).status).toBe(404);
      }
    });
  });
});

describe("Token Redaction", () => {
  it("should redact ghp_ tokens from strings", () => {
    const input = "Error with token ghp_abc123xyz789 in request";
    const output = redactToken(input);
    
    expect(output).not.toContain("ghp_abc123xyz789");
    expect(output).toContain("gh*_[REDACTED]");
  });

  it("should redact all GitHub PAT prefixes", () => {
    const prefixes = ["ghp_", "gho_", "ghu_", "ghs_", "ghr_"];
    for (const prefix of prefixes) {
      const input = `Token: ${prefix}abc123xyz789`;
      const output = redactToken(input);
      expect(output).not.toContain(`${prefix}abc123xyz789`);
      expect(output).toContain("gh*_[REDACTED]");
    }
  });

  it("should redact github_pat_ fine-grained tokens", () => {
    const input = "Token: github_pat_11ABCDEF_xyz123";
    const output = redactToken(input);
    
    expect(output).not.toContain("github_pat_11ABCDEF_xyz123");
    expect(output).toContain("github_pat_[REDACTED]");
  });

  it("should redact Bearer tokens from strings", () => {
    const input = "Authorization: Bearer ghp_secret123";
    const output = redactToken(input);
    
    expect(output).not.toContain("ghp_secret123");
    expect(output).toContain("Bearer [REDACTED]");
  });

  it("should redact x-gh-token header values", () => {
    const input = "x-gh-token: ghp_mysecrettoken123";
    const output = redactToken(input);
    
    expect(output).not.toContain("ghp_mysecrettoken123");
    expect(output).toContain("x-gh-token: [REDACTED]");
  });

  it("should handle strings without tokens", () => {
    const input = "Normal error message";
    const output = redactToken(input);
    
    expect(output).toBe(input);
  });
});

describe("Validation Scenarios", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("should handle empty response gracefully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    const result = await ghFetch<any[]>(ghUrl("/repos/owner/repo/pulls"), { token: "test-token" });
    expect(result).toEqual([]);
  });

  it("should handle malformed JSON response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.reject(new Error("Invalid JSON")),
    });

    await expect(ghFetch(ghUrl("/user"), { token: "test-token" })).rejects.toThrow("Invalid JSON");
  });
});
