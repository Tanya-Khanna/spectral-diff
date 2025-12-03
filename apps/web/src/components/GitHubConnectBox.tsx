"use client";

import { useState } from "react";
import { useGitHubAuth, isApiConfigured, getApiConfigError } from "@/lib/github";

interface GitHubConnectBoxProps {
  onConnected?: () => void;
}

export function GitHubConnectBox({ onConnected }: GitHubConnectBoxProps) {
  const {
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
  } = useGitHubAuth();

  const [tokenInput, setTokenInput] = useState("");
  const [testResult, setTestResult] = useState<{ valid: boolean; username?: string } | null>(null);

  const handleTestToken = async () => {
    if (!tokenInput) return;
    const result = await testToken(tokenInput);
    setTestResult(result.valid ? { valid: true, username: result.user?.username } : { valid: false });
  };

  const handleConnect = async () => {
    if (!tokenInput || !owner || !repo) return;
    const success = await connect(tokenInput, owner, repo);
    if (success) {
      setTokenInput("");
      setTestResult(null);
      onConnected?.();
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setTestResult(null);
  };

  const rateLimitWarning = rateLimit && rateLimit.remaining < 100;

  if (isConnected) {
    return (
      <div className="bg-gray-900/80 backdrop-blur-md rounded-xl border border-gray-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {avatarUrl && (
              <img src={avatarUrl} alt={username || ""} className="w-8 h-8 rounded-full" />
            )}
            <div>
              <p className="text-sm text-emerald-400 font-medium">🔗 Connected</p>
              <p className="text-xs text-gray-400">@{username}</p>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
          >
            Disconnect
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="font-mono">{owner}/{repo}</span>
        </div>

        {rateLimit && (
          <div className={`mt-3 pt-3 border-t border-gray-800 text-xs ${rateLimitWarning ? "text-amber-400" : "text-gray-500"}`}>
            {rateLimitWarning && <span className="mr-1">⚠️</span>}
            Rate limit: {rateLimit.remaining}/{rateLimit.limit}
            <span className="ml-2 text-gray-600">
              Resets {new Date(rateLimit.reset).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>
    );
  }

  const apiConfigError = getApiConfigError();
  const apiReady = isApiConfigured();

  // Show API config error if not configured
  if (apiConfigError && process.env.NODE_ENV === "production") {
    return (
      <div className="bg-red-950/80 backdrop-blur-md rounded-xl border border-red-800 p-4">
        <h3 className="text-sm font-semibold text-red-300 mb-2 flex items-center gap-2">
          <span>⚠️</span> API Not Configured
        </h3>
        <p className="text-xs text-red-400 mb-3">{apiConfigError}</p>
        <p className="text-xs text-gray-500">
          Set <code className="bg-gray-800 px-1 rounded">NEXT_PUBLIC_API_URL</code> to your deployed API endpoint.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/80 backdrop-blur-md rounded-xl border border-gray-800 p-4">
      <h3 className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
        <span>🔐</span> Connect GitHub
      </h3>

      <div className="space-y-3">
        {/* API Warning in dev */}
        {!apiReady && process.env.NODE_ENV !== "production" && (
          <div className="p-2 bg-amber-950/50 border border-amber-800 rounded-lg text-xs text-amber-400">
            ⚠️ Using localhost API. Set NEXT_PUBLIC_API_URL for production.
          </div>
        )}

        {/* PAT Input */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Personal Access Token</label>
          <div className="flex gap-2">
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxx"
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
            <button
              onClick={handleTestToken}
              disabled={!tokenInput || isLoading}
              className="px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-gray-200 rounded-lg transition-colors"
            >
              Test
            </button>
          </div>
          {testResult && (
            <p className={`text-xs mt-1 ${testResult.valid ? "text-emerald-400" : "text-red-400"}`}>
              {testResult.valid ? `✓ Valid token for @${testResult.username}` : "✗ Invalid token"}
            </p>
          )}
        </div>

        {/* Owner/Repo */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Owner</label>
            <input
              id="gh-owner-input"
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="owner"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Repository</label>
            <input
              type="text"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="repo"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-400">⚠️ {error}</p>
        )}

        <button
          onClick={handleConnect}
          disabled={!tokenInput || !owner || !repo || isLoading}
          className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          {isLoading ? "Connecting..." : "Connect"}
        </button>

        <p className="text-xs text-gray-600 text-center">
          Token stored locally only. Never sent to our servers.
        </p>
      </div>
    </div>
  );
}
