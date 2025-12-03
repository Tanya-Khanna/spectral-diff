#!/usr/bin/env node
/**
 * Spectral Diff GitHub MCP Server
 * 
 * Exposes GitHub PR operations as MCP tools for Kiro integration.
 * 
 * Tools:
 * - list_pull_requests: List open PRs for a repo
 * - get_pull_request_files: Get changed files for a PR
 * - get_pull_request_checks: Get CI check status for a PR
 * - post_review_comment: Post a review comment on a PR
 * - approve_pull_request: Approve a PR
 * - request_changes: Request changes on a PR
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_API = "https://api.github.com";

// Tool definitions
const tools = [
  {
    name: "list_pull_requests",
    description: "List open pull requests for a repository",
    inputSchema: {
      type: "object" as const,
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        state: { type: "string", enum: ["open", "closed", "all"], default: "open" },
      },
      required: ["owner", "repo"],
    },
  },
  {
    name: "get_pull_request_files",
    description: "Get the list of changed files in a pull request",
    inputSchema: {
      type: "object" as const,
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        pull_number: { type: "number", description: "Pull request number" },
      },
      required: ["owner", "repo", "pull_number"],
    },
  },
  {
    name: "get_pull_request_checks",
    description: "Get CI check status for a pull request",
    inputSchema: {
      type: "object" as const,
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        pull_number: { type: "number", description: "Pull request number" },
      },
      required: ["owner", "repo", "pull_number"],
    },
  },
  {
    name: "post_review_comment",
    description: "Post a review comment on a pull request",
    inputSchema: {
      type: "object" as const,
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        pull_number: { type: "number", description: "Pull request number" },
        body: { type: "string", description: "Comment body" },
        path: { type: "string", description: "File path to comment on" },
        line: { type: "number", description: "Line number to comment on" },
      },
      required: ["owner", "repo", "pull_number", "body"],
    },
  },
  {
    name: "approve_pull_request",
    description: "Approve a pull request",
    inputSchema: {
      type: "object" as const,
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        pull_number: { type: "number", description: "Pull request number" },
        body: { type: "string", description: "Optional approval message" },
      },
      required: ["owner", "repo", "pull_number"],
    },
  },
  {
    name: "request_changes",
    description: "Request changes on a pull request",
    inputSchema: {
      type: "object" as const,
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        pull_number: { type: "number", description: "Pull request number" },
        body: { type: "string", description: "Review body explaining requested changes" },
      },
      required: ["owner", "repo", "pull_number", "body"],
    },
  },
];

// GitHub API helper
async function githubFetch(endpoint: string, options: RequestInit = {}) {
  if (!GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN environment variable not set");
  }
  
  const response = await fetch(`${GITHUB_API}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error: ${response.status} ${error}`);
  }
  
  return response.json();
}

// Tool handlers
async function handleTool(name: string, args: Record<string, unknown>) {
  switch (name) {
    case "list_pull_requests": {
      const { owner, repo, state = "open" } = args as { owner: string; repo: string; state?: string };
      const prs = await githubFetch(`/repos/${owner}/${repo}/pulls?state=${state}`);
      return prs.map((pr: { number: number; title: string; user: { login: string }; state: string }) => ({
        number: pr.number,
        title: pr.title,
        author: pr.user.login,
        state: pr.state,
      }));
    }
    
    case "get_pull_request_files": {
      const { owner, repo, pull_number } = args as { owner: string; repo: string; pull_number: number };
      const files = await githubFetch(`/repos/${owner}/${repo}/pulls/${pull_number}/files`);
      return files.map((f: { filename: string; status: string; additions: number; deletions: number; changes: number }) => ({
        path: f.filename,
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
        changes: f.changes,
      }));
    }
    
    case "get_pull_request_checks": {
      const { owner, repo, pull_number } = args as { owner: string; repo: string; pull_number: number };
      const pr = await githubFetch(`/repos/${owner}/${repo}/pulls/${pull_number}`);
      const checks = await githubFetch(`/repos/${owner}/${repo}/commits/${pr.head.sha}/check-runs`);
      return {
        sha: pr.head.sha,
        checks: checks.check_runs.map((c: { name: string; status: string; conclusion: string | null }) => ({
          name: c.name,
          status: c.status,
          conclusion: c.conclusion,
        })),
      };
    }
    
    case "post_review_comment": {
      const { owner, repo, pull_number, body, path, line } = args as {
        owner: string; repo: string; pull_number: number; body: string; path?: string; line?: number;
      };
      
      if (path && line) {
        // Line-specific comment
        const pr = await githubFetch(`/repos/${owner}/${repo}/pulls/${pull_number}`);
        return await githubFetch(`/repos/${owner}/${repo}/pulls/${pull_number}/comments`, {
          method: "POST",
          body: JSON.stringify({
            body,
            commit_id: pr.head.sha,
            path,
            line,
          }),
        });
      } else {
        // General comment
        return await githubFetch(`/repos/${owner}/${repo}/issues/${pull_number}/comments`, {
          method: "POST",
          body: JSON.stringify({ body }),
        });
      }
    }
    
    case "approve_pull_request": {
      const { owner, repo, pull_number, body = "LGTM 👻" } = args as {
        owner: string; repo: string; pull_number: number; body?: string;
      };
      return await githubFetch(`/repos/${owner}/${repo}/pulls/${pull_number}/reviews`, {
        method: "POST",
        body: JSON.stringify({
          event: "APPROVE",
          body,
        }),
      });
    }
    
    case "request_changes": {
      const { owner, repo, pull_number, body } = args as {
        owner: string; repo: string; pull_number: number; body: string;
      };
      return await githubFetch(`/repos/${owner}/${repo}/pulls/${pull_number}/reviews`, {
        method: "POST",
        body: JSON.stringify({
          event: "REQUEST_CHANGES",
          body,
        }),
      });
    }
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// Create and run server
const server = new Server(
  { name: "spectral-github-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    const result = await handleTool(name, args as Record<string, unknown>);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true,
    };
  }
});

// Start server
const transport = new StdioServerTransport();
server.connect(transport).catch(console.error);
