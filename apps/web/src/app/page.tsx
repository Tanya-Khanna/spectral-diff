"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSpectral } from "@/lib/store";
import { FogLayer } from "@/components/FogLayer";
import { GitHubConnectBox } from "@/components/GitHubConnectBox";
import { PRPicker } from "@/components/PRPicker";
import { useGitHubAuth, GitHubPR, fetchPRMeta, fetchPRFiles, fetchCheckRuns } from "@/lib/github";
import { mapGitHubFilesToRooms } from "@/lib/github-mapper";

export default function LobbyPage() {
  const router = useRouter();
  const { repoName, prTitle, prNumber, files, reduceEffects, isRealMode, loadRealPR, resetToDemo } = useSpectral();
  const { isConnected, owner, repo, getToken } = useGitHubAuth();
  const [isLoadingPR, setIsLoadingPR] = useState(false);

  const totalRisk = files.length > 0 ? Math.round(files.reduce((sum, f) => sum + f.risk, 0) / files.length) : 0;
  const totalLOC = files.reduce((sum, f) => sum + f.locChanged, 0);
  const failingChecks = files.filter(f => !f.checksPassing).length;

  const [prLoadError, setPrLoadError] = useState<string | null>(null);

  const handleSelectPR = async (pr: GitHubPR) => {
    const token = getToken();
    if (!token || !owner || !repo) return;
    
    setIsLoadingPR(true);
    setPrLoadError(null);
    try {
      // Fetch PR metadata
      const meta = await fetchPRMeta(token, owner, repo, pr.number);
      
      // Fetch PR files
      const ghFiles = await fetchPRFiles(token, owner, repo, pr.number);
      
      // Fetch check runs
      let checkRuns: Array<{ id: number; name: string; status: string; conclusion: string | null }> = [];
      try {
        const checksData = await fetchCheckRuns(token, owner, repo, meta.headSha);
        checkRuns = checksData.check_runs || [];
      } catch {
        // Checks might not be available
      }
      
      // Map to our model
      const mappedFiles = mapGitHubFilesToRooms(ghFiles, checkRuns);
      
      // Load into store
      loadRealPR(
        `${owner}/${repo}`,
        meta.title,
        meta.number,
        mappedFiles,
        {
          headSha: meta.headSha,
          headRef: meta.headRef,
          baseRef: meta.baseRef,
          user: meta.user,
        }
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load PR";
      setPrLoadError(message);
      console.error("Failed to load PR:", err);
    } finally {
      setIsLoadingPR(false);
    }
  };

  const retryLoadPR = () => {
    setPrLoadError(null);
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center relative py-8">
      {/* Background atmosphere */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 50% 100%, rgba(88, 28, 135, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse 60% 40% at 20% 20%, rgba(30, 30, 50, 0.3) 0%, transparent 50%),
              radial-gradient(ellipse 50% 30% at 80% 30%, rgba(40, 30, 60, 0.2) 0%, transparent 50%)
            `
          }}
        />
        {!reduceEffects && <FogLayer intensity={30} />}
      </div>

      {/* Main content */}
      <div className={`relative z-10 w-full max-w-4xl mx-auto px-4 ${!reduceEffects ? "animate-fade-in" : ""}`}>
        {/* Gothic title */}
        <div className="text-center mb-8">
          <span className="text-6xl mb-4 block">👻</span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-100 mb-2 tracking-tight">
            Spectral Diff
          </h1>
          <p className="text-gray-500 text-lg">
            Where code review meets the supernatural
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left column: GitHub Connect + PR Picker */}
          <div className="space-y-4">
            <GitHubConnectBox />
            
            {isConnected && owner && repo && (
              <PRPicker
                token={getToken()}
                owner={owner}
                repo={repo}
                onSelectPR={handleSelectPR}
              />
            )}
            
            {!isConnected && (
              <div className="bg-gray-900/60 rounded-xl border border-gray-800/50 p-4 text-center">
                <p className="text-sm text-gray-500 mb-2">Or explore with demo data</p>
                <button
                  onClick={resetToDemo}
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  Load Demo PR →
                </button>
              </div>
            )}
          </div>

          {/* Right column: PR Card */}
          <div className="space-y-4">
            {/* PR Load Error */}
            {prLoadError && (
              <div className="bg-red-950/80 backdrop-blur-md rounded-2xl border border-red-800 p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-300">Failed to load PR</p>
                    <p className="text-xs text-red-400 mt-1">{prLoadError}</p>
                    <button
                      onClick={retryLoadPR}
                      className="mt-2 text-xs text-red-300 hover:text-red-200 underline"
                    >
                      Dismiss and try again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isLoadingPR ? (
              <div className="bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-800 p-6 text-center">
                <span className="text-4xl animate-pulse">👻</span>
                <p className="text-gray-400 mt-2">Summoning PR data...</p>
              </div>
            ) : (
              <div className="bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-800 p-6 text-left">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs text-gray-500">{repoName}</p>
                      {isRealMode && (
                        <span className="text-xs px-1.5 py-0.5 bg-emerald-900/50 text-emerald-400 rounded">
                          Live
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-semibold text-gray-100 truncate">{prTitle}</h2>
                    <p className="text-purple-400 text-sm">#{prNumber}</p>
                  </div>
                  <div className={`
                    px-3 py-1.5 rounded-full text-sm font-bold shrink-0
                    ${totalRisk > 60 ? "bg-red-900/50 text-red-300" : 
                      totalRisk > 40 ? "bg-amber-900/50 text-amber-300" : 
                      "bg-purple-900/50 text-purple-300"}
                  `}>
                    Risk: {totalRisk}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-gray-800">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-100">{files.length}</p>
                    <p className="text-xs text-gray-500">Haunted Rooms</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-100">{totalLOC}</p>
                    <p className="text-xs text-gray-500">Lines Changed</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${failingChecks > 0 ? "text-red-400" : "text-emerald-400"}`}>
                      {failingChecks > 0 ? failingChecks : "✓"}
                    </p>
                    <p className="text-xs text-gray-500">{failingChecks > 0 ? "Failing Checks" : "All Passing"}</p>
                  </div>
                </div>

                {/* File preview */}
                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Most Haunted</p>
                    {[...files]
                      .sort((a, b) => b.risk - a.risk)
                      .slice(0, 3)
                      .map(file => (
                        <div 
                          key={file.path}
                          className="flex items-center justify-between py-2 px-3 bg-gray-800/50 rounded-lg"
                        >
                          <span className="text-sm text-gray-300 font-mono truncate flex-1">
                            {file.path}
                          </span>
                          <span className={`
                            text-xs px-2 py-0.5 rounded-full ml-2
                            ${file.risk > 75 ? "bg-red-900/50 text-red-300" : 
                              file.risk > 50 ? "bg-amber-900/50 text-amber-300" : 
                              "bg-gray-700 text-gray-400"}
                          `}>
                            {file.risk}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* CTA */}
            {files.length > 0 && (
              <button
                onClick={() => router.push("/house")}
                className="
                  w-full px-8 py-4 rounded-2xl text-lg font-semibold
                  bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800
                  hover:from-purple-500 hover:via-purple-600 hover:to-purple-700
                  text-white shadow-2xl shadow-purple-900/40
                  transition-all duration-300 hover:scale-[1.02]
                  focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-950
                "
              >
                🏰 Enter the Haunted House
              </button>
            )}

            {isRealMode && (
              <button
                onClick={resetToDemo}
                className="w-full text-sm text-gray-500 hover:text-gray-400"
              >
                Switch to demo mode
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
