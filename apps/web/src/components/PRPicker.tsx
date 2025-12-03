"use client";

import { useState, useEffect } from "react";
import { fetchPRs, GitHubPR } from "@/lib/github";

interface PRPickerProps {
  token: string;
  owner: string;
  repo: string;
  onSelectPR: (pr: GitHubPR) => void;
}

export function PRPicker({ token, owner, repo, onSelectPR }: PRPickerProps) {
  const [prs, setPRs] = useState<GitHubPR[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPRs = async () => {
    if (!token || !owner || !repo) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchPRs(token, owner, repo);
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
          onClick={loadPRs}
          className="mt-2 text-xs text-purple-400 hover:text-purple-300"
        >
          Try again
        </button>
      </div>
    );
  }

  if (prs.length === 0) {
    return (
      <div className="bg-gray-900/80 backdrop-blur-md rounded-xl border border-gray-800 p-4">
        <p className="text-sm text-gray-400">No open pull requests found</p>
        <button
          onClick={loadPRs}
          className="mt-2 text-xs text-purple-400 hover:text-purple-300"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/80 backdrop-blur-md rounded-xl border border-gray-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-200">
          📋 Open Pull Requests ({prs.length})
        </h3>
        <button
          onClick={loadPRs}
          className="text-xs text-purple-400 hover:text-purple-300"
        >
          Refresh
        </button>
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
                <p className="text-sm text-gray-200 font-medium truncate group-hover:text-purple-300">
                  {pr.title}
                </p>
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
