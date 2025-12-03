"use client";

import { useState, useEffect } from "react";
import { fetchPRs, GitHubPR, PRState } from "@/lib/github";

interface PRPickerProps {
  token: string;
  owner: string;
  repo: string;
  onSelectPR: (pr: GitHubPR) => void;
  onSwitchRepo?: () => void;
}

export function PRPicker({ token, owner, repo, onSelectPR, onSwitchRepo }: PRPickerProps) {
  const [prs, setPRs] = useState<GitHubPR[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prState, setPrState] = useState<PRState>("open");

  const loadPRs = async (state: PRState = prState) => {
    if (!token || !owner || !repo) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchPRs(token, owner, repo, state);
      setPRs(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPRs();
  }, [token, owner, repo]);

  const handleStateChange = (newState: PRState) => {
    setPrState(newState);
    loadPRs(newState);
  };

  if (isLoading) {
    return (
      <div className="bg-gray-900/80 backdrop-blur-md rounded-xl border border-gray-800 p-4">
        <div className="flex items-center gap-2 text-gray-400">
          <span className="animate-pulse">👻</span>
          <span className="text-sm">Summoning pull requests...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900/80 backdrop-blur-md rounded-xl border border-gray-800 p-4">
        <p className="text-sm text-red-400">⚠️ {error}</p>
        <button
          onClick={() => loadPRs()}
          className="mt-2 text-xs text-purple-400 hover:text-purple-300"
        >
          Try again
        </button>
      </div>
    );
  }

  // Empty state with helpful actions
  if (prs.length === 0) {
    return (
      <div className="bg-gray-900/80 backdrop-blur-md rounded-xl border border-gray-800 p-4">
        <div className="text-center py-4">
          <span className="text-4xl mb-3 block">🏚️</span>
          <p className="text-sm text-gray-300 font-medium mb-1">
            No {prState === "open" ? "open" : prState === "closed" ? "closed" : ""} pull requests found
          </p>
          <p className="text-xs text-gray-500 mb-4">
            {owner}/{repo}
          </p>
          
          <div className="flex flex-col gap-2">
            {/* Show closed/all PRs option */}
            {prState === "open" && (
              <button
                onClick={() => handleStateChange("closed")}
                className="w-full px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
              >
                👻 Show closed PRs
              </button>
            )}
            {prState === "closed" && (
              <button
                onClick={() => handleStateChange("open")}
                className="w-full px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
              >
                📋 Show open PRs
              </button>
            )}
            {prState !== "all" && (
              <button
                onClick={() => handleStateChange("all")}
                className="w-full px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
              >
                📚 Show all PRs
              </button>
            )}
            
            {/* Switch repo option */}
            {onSwitchRepo && (
              <button
                onClick={onSwitchRepo}
                className="w-full px-3 py-2 text-sm bg-purple-900/50 hover:bg-purple-800/50 text-purple-300 rounded-lg transition-colors"
              >
                🔄 Switch repository
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/80 backdrop-blur-md rounded-xl border border-gray-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-200">
            📋 Pull Requests ({prs.length})
          </h3>
          {/* State filter badge */}
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            prState === "open" ? "bg-emerald-900/50 text-emerald-400" :
            prState === "closed" ? "bg-red-900/50 text-red-400" :
            "bg-purple-900/50 text-purple-400"
          }`}>
            {prState}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* State filter dropdown */}
          <select
            value={prState}
            onChange={(e) => handleStateChange(e.target.value as PRState)}
            className="text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="all">All</option>
          </select>
          <button
            onClick={() => loadPRs()}
            className="text-xs text-purple-400 hover:text-purple-300"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {prs.map((pr) => (
          <button
            key={pr.number}
            onClick={() => onSelectPR(pr)}
            className="w-full text-left p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-200 font-medium truncate group-hover:text-purple-300">
                    {pr.title}
                  </p>
                  {pr.state === "closed" && (
                    <span className="text-xs px-1.5 py-0.5 bg-red-900/50 text-red-400 rounded shrink-0">
                      closed
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  #{pr.number} by {pr.user.login}
                </p>
              </div>
              <span className="text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                Review →
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
