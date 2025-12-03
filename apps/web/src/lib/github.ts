"use client";

import { useState, useEffect, useCallback } from "react";

// API URL - no fallback in production to prevent silent failures
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

// Check if API is properly configured (not localhost in production)
export function isApiConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) return false;
  if (url.includes("localhost") && process.env.NODE_ENV === "production") return false;
  return true;
}

// Get API configuration error message
export function getApiConfigError(): string | null {
  if (!process.env.NEXT_PUBLIC_API_URL) {
    return "API not configured. Set NEXT_PUBLIC_API_URL environment variable.";
  }
  if (process.env.NEXT_PUBLIC_API_URL.includes("localhost") && process.env.NODE_ENV === "production") {
    return "API URL points to localhost in production. Set NEXT_PUBLIC_API_URL to your deployed API.";
  }
  return null;
}

export interface RateLimit {
  remaining: number;
  limit: number;
  reset: string;
}

export interface GitHubUser {
  username: string;
  avatarUrl: string;
  rateLimit: RateLimit;
}

export interface GitHubPR {
  number: number;
  title: string;
  user: { login: string };
  state: string;
  head: { sha: string; ref: string };
  base: { ref: string };
}

export interface GitHubFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

export interface CheckRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
}

// localStorage keys
const STORAGE_KEYS = {
  token: "gh_token",
  owner: "gh_owner",
  repo: "gh_repo",
} as const;

// API response envelope
interface ApiEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: { code: string; message: string };
}

async function apiFetch<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "x-gh-token": token,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  // Handle non-JSON responses gracefully
  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`API returned non-JSON (${res.status}): ${text.slice(0, 120)}`);
  }
  
  if (!res.ok || json?.ok === false) {
    const message = json?.error?.message || json?.error || `API error: ${res.status}`;
    throw new Error(message);
  }
  
  // Support both {ok:true, data:...} and legacy {ok:true, ...rest}
  return (json && "data" in json ? json.data : json) as T;
}

// Result type for operations that can fail
export interface ApiResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

// Helper to validate token (defined outside hook to avoid hoisting issues)
async function validateStoredToken(token: string): Promise<ApiResult<GitHubUser>> {
  try {
    const user = await apiFetch<GitHubUser>("/gh/me", token);
    return { ok: true, data: user };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Token validation failed";
    return { ok: false, error: message };
  }
}

export function useGitHubAuth() {
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [owner, setOwner] = useState<string>("");
  const [repo, setRepo] = useState<string>("");
  const [rateLimit, setRateLimit] = useState<RateLimit | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_KEYS.token);
    const storedOwner = localStorage.getItem(STORAGE_KEYS.owner) || "";
    const storedRepo = localStorage.getItem(STORAGE_KEYS.repo) || "";
    
    setOwner(storedOwner);
    setRepo(storedRepo);
    
    if (storedToken) {
      // Validate stored token
      validateStoredToken(storedToken).then((result) => {
        if (result.ok && result.data) {
          setIsConnected(true);
          setUsername(result.data.username);
          setAvatarUrl(result.data.avatarUrl);
          setRateLimit(result.data.rateLimit);
        } else if (result.error) {
          // Show error but don't block - user can reconnect
          setError(result.error);
        }
      });
    }
  }, []);

  const testToken = useCallback(async (token: string): Promise<{ valid: boolean; user?: GitHubUser }> => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await apiFetch<GitHubUser>("/gh/me", token);
      setIsLoading(false);
      return { valid: true, user };
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
      return { valid: false };
    }
  }, []);

  const connect = useCallback(async (token: string, newOwner: string, newRepo: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await apiFetch<GitHubUser>("/gh/me", token);
      
      // Store credentials
      localStorage.setItem(STORAGE_KEYS.token, token);
      localStorage.setItem(STORAGE_KEYS.owner, newOwner);
      localStorage.setItem(STORAGE_KEYS.repo, newRepo);
      
      setIsConnected(true);
      setUsername(user.username);
      setAvatarUrl(user.avatarUrl);
      setOwner(newOwner);
      setRepo(newRepo);
      setRateLimit(user.rateLimit);
      setIsLoading(false);
      return true;
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
      return false;
    }
  }, []);

  const disconnect = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.owner);
    localStorage.removeItem(STORAGE_KEYS.repo);
    
    setIsConnected(false);
    setUsername(null);
    setAvatarUrl(null);
    setRateLimit(null);
    setError(null);
  }, []);

  const getToken = useCallback(() => {
    return localStorage.getItem(STORAGE_KEYS.token) || "";
  }, []);

  return {
    isConnected,
    username,
    avatarUrl,
    owner,
    repo,
    rateLimit,
    isLoading,
    error,
    setOwner,
    setRepo,
    connect,
    disconnect,
    testToken,
    getToken,
  };
}


// PR state filter type
export type PRState = "open" | "closed" | "all";

// GitHub API functions
export async function fetchPRs(
  token: string, 
  owner: string, 
  repo: string, 
  state: PRState = "open"
): Promise<GitHubPR[]> {
  const result = await apiFetch<GitHubPR[]>(
    `/gh/pulls?owner=${owner}&repo=${repo}&state=${state}`, 
    token
  );
  // Ensure we always return an array
  return Array.isArray(result) ? result : [];
}

export async function fetchPRMeta(
  token: string,
  owner: string,
  repo: string,
  prNumber: number
): Promise<{
  number: number;
  headSha: string;
  headRef: string;
  baseRef: string;
  title: string;
  body: string;
  user: string;
  state: string;
}> {
  return apiFetch(`/gh/pulls/${prNumber}/meta?owner=${owner}&repo=${repo}`, token);
}

export async function fetchPRFiles(
  token: string,
  owner: string,
  repo: string,
  prNumber: number
): Promise<GitHubFile[]> {
  const result = await apiFetch<GitHubFile[]>(`/gh/pulls/${prNumber}/files?owner=${owner}&repo=${repo}`, token);
  // Ensure we always return an array
  return Array.isArray(result) ? result : [];
}

export async function fetchCheckRuns(
  token: string,
  owner: string,
  repo: string,
  ref: string
): Promise<{ total_count: number; check_runs: CheckRun[] }> {
  const result = await apiFetch<{ total_count: number; check_runs: CheckRun[] }>(
    `/gh/pulls/0/checks?owner=${owner}&repo=${repo}&ref=${ref}`, 
    token
  );
  // Ensure safe defaults
  return {
    total_count: result?.total_count ?? 0,
    check_runs: Array.isArray(result?.check_runs) ? result.check_runs : [],
  };
}

export async function postReview(
  token: string,
  owner: string,
  repo: string,
  prNumber: number,
  event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT",
  body?: string
): Promise<any> {
  return apiFetch(`/gh/pulls/${prNumber}/review?owner=${owner}&repo=${repo}`, token, {
    method: "POST",
    body: JSON.stringify({ event, body }),
  });
}

export async function postComment(
  token: string,
  owner: string,
  repo: string,
  prNumber: number,
  body: string
): Promise<any> {
  return apiFetch(`/gh/pulls/${prNumber}/comment?owner=${owner}&repo=${repo}`, token, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export async function applyPatch(
  token: string,
  owner: string,
  repo: string,
  prNumber: number,
  headRef: string,
  headSha: string,
  commitMessage: string,
  fileEdits: Array<{ path: string; content: string }>
): Promise<{ ok: boolean; commitSha?: string; error?: string }> {
  return apiFetch(`/gh/pulls/${prNumber}/apply-patch?owner=${owner}&repo=${repo}`, token, {
    method: "POST",
    body: JSON.stringify({ headRef, headSha, commitMessage, fileEdits }),
  });
}
