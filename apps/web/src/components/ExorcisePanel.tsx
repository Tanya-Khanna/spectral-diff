"use client";

import { useState } from "react";
import { Hunk, FileChange } from "@/lib/types";
import { useSpectral } from "@/lib/store";
import { useSound } from "./SoundProvider";
import { postReview, postComment, applyPatch, fetchCheckRuns } from "@/lib/github";

interface ExorcisePanelProps {
  file: FileChange;
  hunk: Hunk;
  onPostComment: () => void;
  onRequestChanges: () => void;
  onBack: () => void;
}

type Mode = "safe" | "patch" | "approve";
type ActionStatus = "idle" | "loading" | "success" | "error";
type PatchStep = "idle" | "creating-blob" | "creating-tree" | "creating-commit" | "pushing" | "done" | "error";

export function ExorcisePanel({
  file,
  hunk,
  onPostComment,
  onRequestChanges,
  onBack,
}: ExorcisePanelProps) {
  const [mode, setMode] = useState<Mode>("safe");
  const [patchConfirmed, setPatchConfirmed] = useState(false);
  const [patchStaged, setPatchStaged] = useState(false);
  const [actionStatus, setActionStatus] = useState<ActionStatus>("idle");
  const [actionMessage, setActionMessage] = useState<string>("");
  const [checkStatus, setCheckStatus] = useState<"polling" | "passed" | "failed" | "timeout" | null>(null);
  const [patchStep, setPatchStep] = useState<PatchStep>("idle");
  const [pollCancelled, setPollCancelled] = useState(false);
  const { reduceEffects, isRealMode, prNumber, repoName, prMeta, canApplyPatch, canApprove, canRequestChanges } = useSpectral();
  const { play } = useSound();

  const getToken = () => localStorage.getItem("gh_token") || "";
  const getOwnerRepo = () => {
    const parts = repoName.split("/");
    return { owner: parts[0], repo: parts[1] };
  };

  const handleRealComment = async () => {
    if (!isRealMode) {
      // Demo mode - show toast but no API call
      setActionStatus("success");
      setActionMessage("Demo mode: Comment would be posted here");
      play("seal");
      onPostComment();
      return;
    }
    
    const token = getToken();
    const { owner, repo } = getOwnerRepo();
    if (!token || !owner || !repo) {
      setActionStatus("error");
      setActionMessage("Missing GitHub credentials");
      console.error("[Spectral] Comment failed: missing credentials");
      return;
    }
    
    setActionStatus("loading");
    try {
      const comment = `👻 **Spectral Diff Review**\n\n📁 \`${file.path}\`\n\n${hunk.commentSuggestion}`;
      await postComment(token, owner, repo, prNumber, comment);
      setActionStatus("success");
      setActionMessage("Comment posted successfully!");
      play("seal");
      onPostComment();
    } catch (err) {
      setActionStatus("error");
      const message = err instanceof Error ? err.message : "Unknown error";
      setActionMessage(message);
      console.error("[Spectral] Comment failed:", message);
    }
  };

  const handleRealRequestChanges = async () => {
    if (!canRequestChanges()) {
      setActionStatus("error");
      setActionMessage("Connect to GitHub to request changes");
      return;
    }
    
    const token = getToken();
    const { owner, repo } = getOwnerRepo();
    if (!token || !owner || !repo) {
      setActionStatus("error");
      setActionMessage("Missing GitHub credentials");
      console.error("[Spectral] Request changes failed: missing credentials");
      return;
    }
    
    setActionStatus("loading");
    try {
      const body = `👻 **Spectral Diff requests changes**\n\n📁 \`${file.path}\`\n\n${hunk.redFlags.map(f => `- ${f}`).join("\n")}\n\n${hunk.commentSuggestion}`;
      await postReview(token, owner, repo, prNumber, "REQUEST_CHANGES", body);
      setActionStatus("success");
      setActionMessage("Changes requested!");
      play("seal");
      onRequestChanges();
    } catch (err) {
      setActionStatus("error");
      const message = err instanceof Error ? err.message : "Unknown error";
      setActionMessage(message);
      console.error("[Spectral] Request changes failed:", message);
    }
  };

  const handleRealApprove = async () => {
    if (!canApprove()) {
      setActionStatus("error");
      setActionMessage("Connect to GitHub to approve");
      return;
    }
    
    const token = getToken();
    const { owner, repo } = getOwnerRepo();
    if (!token || !owner || !repo) {
      setActionStatus("error");
      setActionMessage("Missing GitHub credentials");
      console.error("[Spectral] Approve failed: missing credentials");
      return;
    }
    
    setActionStatus("loading");
    try {
      await postReview(token, owner, repo, prNumber, "APPROVE", "👻 The spirits approve this offering. LGTM!");
      setActionStatus("success");
      setActionMessage("PR Approved!");
      play("seal");
    } catch (err) {
      setActionStatus("error");
      const message = err instanceof Error ? err.message : "Unknown error";
      setActionMessage(message);
      console.error("[Spectral] Approve failed:", message);
    }
  };

  const [pollError, setPollError] = useState<string | null>(null);
  const [pollRetries, setPollRetries] = useState(0);
  const MAX_POLL_RETRIES = 3;

  const pollChecks = async (sha: string) => {
    const token = getToken();
    const { owner, repo } = getOwnerRepo();
    if (!token || !owner || !repo) return;
    
    setCheckStatus("polling");
    setPollCancelled(false);
    setPollError(null);
    setPollRetries(0);
    
    let consecutiveErrors = 0;
    
    // Poll for up to 2 minutes (24 * 5s = 120s)
    for (let i = 0; i < 24; i++) {
      // Check if user cancelled
      if (pollCancelled) {
        setCheckStatus(null);
        return;
      }
      
      await new Promise(r => setTimeout(r, 5000));
      
      try {
        const data = await fetchCheckRuns(token, owner, repo, sha);
        const runs = data.check_runs || [];
        consecutiveErrors = 0; // Reset on success
        
        if (runs.length === 0) continue;
        
        const allComplete = runs.every((r: { status: string }) => r.status === "completed");
        if (!allComplete) continue;
        
        const allPassed = runs.every((r: { conclusion: string | null }) => 
          r.conclusion === "success" || r.conclusion === "skipped"
        );
        
        setCheckStatus(allPassed ? "passed" : "failed");
        if (allPassed) play("seal");
        return;
      } catch (err) {
        consecutiveErrors++;
        setPollRetries(consecutiveErrors);
        
        if (consecutiveErrors >= MAX_POLL_RETRIES) {
          const message = err instanceof Error ? err.message : "Network error";
          setPollError(`Checks polling failed: ${message}`);
          setCheckStatus("failed");
          return;
        }
        // Continue polling with retry
      }
    }
    
    // Timeout after 2 minutes
    setCheckStatus("timeout");
  };

  const cancelPolling = () => {
    setPollCancelled(true);
    setCheckStatus(null);
  };

  const handleApplyPatch = async () => {
    if (!patchConfirmed) {
      setPatchConfirmed(true);
      return;
    }
    
    if (!canApplyPatch()) {
      setActionStatus("error");
      setActionMessage("Connect to GitHub to apply patches. Requires 'repo' scope on your PAT.");
      console.error("[Spectral] Apply patch blocked: not in real mode or missing PR meta");
      return;
    }
    
    const token = getToken();
    const { owner, repo } = getOwnerRepo();
    if (!token || !owner || !repo || !hunk.fixSnippet || !prMeta) {
      setActionStatus("error");
      setActionMessage("Missing credentials or fix snippet");
      console.error("[Spectral] Apply patch failed: missing required data");
      return;
    }
    
    setActionStatus("loading");
    setPatchStep("creating-blob");
    
    try {
      // Show progress through steps
      setPatchStep("creating-commit");
      setActionMessage("Creating commit...");
      
      const result = await applyPatch(
        token, owner, repo, prNumber,
        prMeta.headRef,
        prMeta.headSha,
        `🔧 Fix: ${file.path} - Applied Spectral Diff suggestion`,
        [{ path: file.path, content: hunk.fixSnippet }]
      );
      
      if (result.ok && result.commitSha) {
        setPatchStep("pushing");
        setActionMessage("Pushing to branch...");
        
        // Small delay to show the push step
        await new Promise(r => setTimeout(r, 500));
        
        setPatchStep("done");
        setActionStatus("success");
        setActionMessage(`Commit ${result.commitSha.slice(0, 7)} pushed! Polling checks...`);
        setPatchStaged(true);
        play("seal");
        
        // Start polling checks
        pollChecks(result.commitSha);
      } else {
        throw new Error(result.error || "Failed to apply patch");
      }
    } catch (err: any) {
      setPatchStep("error");
      setActionStatus("error");
      
      // Parse specific error types
      const msg = err.message || "Unknown error";
      if (msg.includes("403") || msg.includes("FORBIDDEN")) {
        setActionMessage("Permission denied. Ensure your PAT has 'repo' scope and you have write access to this branch.");
      } else if (msg.includes("409") || msg.includes("conflict")) {
        setActionMessage("Conflict detected. The branch may have been updated. Refresh and try again.");
      } else if (msg.includes("422") || msg.includes("protected")) {
        setActionMessage("Branch is protected. Direct pushes are not allowed. Create a new PR instead.");
      } else if (msg.includes("401") || msg.includes("UNAUTHORIZED")) {
        setActionMessage("Token expired or invalid. Please reconnect to GitHub.");
      } else {
        setActionMessage(msg);
      }
      
      console.error("[Spectral] Apply patch failed:", msg);
    }
  };

  return (
    <div className={`
      bg-gray-900/95 rounded-2xl border border-gray-800
      shadow-2xl overflow-hidden
      ${!reduceEffects ? "animate-fade-in" : ""}
    `}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-purple-900/30 to-gray-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚗️</span>
            <div>
              <h2 className="font-semibold text-gray-100">Exorcise Chamber</h2>
              <p className="text-xs text-gray-500 font-mono">{file.path}</p>
            </div>
          </div>
          <button
            onClick={onBack}
            className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex gap-2">
          <button
            onClick={() => setMode("safe")}
            className={`
              flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all
              focus:outline-none focus:ring-2 focus:ring-purple-500
              ${mode === "safe" 
                ? "bg-purple-900/50 text-purple-300 border border-purple-700" 
                : "bg-gray-800/50 text-gray-400 border border-gray-700 hover:bg-gray-800"
              }
            `}
          >
            🛡️ Review
          </button>
          <button
            onClick={() => { setMode("patch"); setPatchConfirmed(false); setPatchStaged(false); setActionStatus("idle"); }}
            className={`
              flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all
              focus:outline-none focus:ring-2 focus:ring-purple-500
              ${mode === "patch" 
                ? "bg-amber-900/50 text-amber-300 border border-amber-700" 
                : "bg-gray-800/50 text-gray-400 border border-gray-700 hover:bg-gray-800"
              }
            `}
          >
            ⚡ Patch
          </button>
          {isRealMode && (
            <button
              onClick={() => { setMode("approve"); setActionStatus("idle"); }}
              className={`
                flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all
                focus:outline-none focus:ring-2 focus:ring-emerald-500
                ${mode === "approve" 
                  ? "bg-emerald-900/50 text-emerald-300 border border-emerald-700" 
                  : "bg-gray-800/50 text-gray-400 border border-gray-700 hover:bg-gray-800"
                }
              `}
            >
              ✓ Approve
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
        {/* Red Flags */}
        {hunk.redFlags.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span>🚩</span> Red Flags
            </h3>
            <div className="space-y-2">
              {hunk.redFlags.map((flag, i) => (
                <div 
                  key={i}
                  className="p-3 bg-red-950/30 border border-red-900/50 rounded-xl text-sm text-red-300"
                >
                  {flag}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Suggested Comment */}
        {hunk.commentSuggestion && (
          <section>
            <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span>💬</span> Suggested Comment
            </h3>
            <div className="p-3 bg-purple-950/30 border border-purple-900/50 rounded-xl">
              <p className="text-sm text-purple-200 italic">&ldquo;{hunk.commentSuggestion}&rdquo;</p>
            </div>
          </section>
        )}

        {/* Suggested Fix */}
        {hunk.fixSnippet && (
          <section>
            <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span>🔧</span> Suggested Fix
            </h3>
            <pre className="p-3 bg-gray-800/80 border border-gray-700 rounded-xl text-sm text-emerald-300 font-mono overflow-x-auto">
              {hunk.fixSnippet}
            </pre>
          </section>
        )}

        {/* Suggested Test */}
        {hunk.testSuggestion && (
          <section>
            <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span>🧪</span> Suggested Test
            </h3>
            <pre className="p-3 bg-gray-800/80 border border-gray-700 rounded-xl text-sm text-blue-300 font-mono overflow-x-auto">
              {hunk.testSuggestion}
            </pre>
          </section>
        )}

        {/* Patch Preview (only in patch mode) */}
        {mode === "patch" && (
          <section>
            {/* Patch limitations notice */}
            <div className="mb-3 p-2 bg-gray-800/50 border border-gray-700 rounded-lg">
              <p className="text-xs text-gray-400">
                📝 Applies to <span className="text-amber-400 font-medium">1 file only</span> • Modifies existing content • No delete/rename
              </p>
            </div>

            {hunk.patchPreview ? (
              <>
                <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span>📜</span> Unified Diff Patch
                </h3>
                <pre className="p-3 bg-gray-950 border border-amber-900/50 rounded-xl text-xs text-gray-300 font-mono overflow-x-auto">
                  {hunk.patchPreview}
                </pre>
                
                {patchStaged ? (
                  <div className="mt-3 p-3 bg-emerald-950/50 border border-emerald-700 rounded-xl text-emerald-300 text-sm flex items-center gap-2">
                    <span>✓</span> Patch staged successfully
                  </div>
                ) : patchConfirmed ? (
                  <div className="mt-3 p-3 bg-amber-950/50 border border-amber-700 rounded-xl text-amber-300 text-sm">
                    ⚠️ Click &ldquo;Confirm Apply&rdquo; again to stage this patch
                  </div>
                ) : null}
              </>
            ) : (
              <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-xl text-sm text-gray-400">
                No fix snippet available for this hunk
              </div>
            )}
          </section>
        )}
      </div>

      {/* Status Message */}
      {actionStatus !== "idle" && (
        <div className={`mx-4 mb-4 p-3 rounded-xl text-sm ${
          actionStatus === "loading" ? "bg-purple-950/50 text-purple-300 border border-purple-700" :
          actionStatus === "success" ? "bg-emerald-950/50 text-emerald-300 border border-emerald-700" :
          "bg-red-950/50 text-red-300 border border-red-700"
        }`}>
          {actionStatus === "loading" && <span className="animate-pulse">👻 </span>}
          {actionStatus === "success" && "✓ "}
          {actionStatus === "error" && "⚠️ "}
          {actionMessage || (actionStatus === "loading" ? "Working..." : "")}
        </div>
      )}

      {/* Patch Progress Steps */}
      {mode === "patch" && patchStep !== "idle" && patchStep !== "done" && patchStep !== "error" && (
        <div className="mx-4 mb-4 p-3 rounded-xl text-sm bg-amber-950/50 text-amber-300 border border-amber-700">
          <div className="flex items-center gap-3">
            <span className="animate-pulse">⚡</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-xs text-amber-400/70 mb-1">
                <span className={patchStep === "creating-blob" ? "text-amber-300" : "text-amber-500"}>Blob</span>
                <span>→</span>
                <span className={patchStep === "creating-tree" ? "text-amber-300" : "text-amber-500"}>Tree</span>
                <span>→</span>
                <span className={patchStep === "creating-commit" ? "text-amber-300" : "text-amber-500"}>Commit</span>
                <span>→</span>
                <span className={patchStep === "pushing" ? "text-amber-300" : "text-amber-500"}>Push</span>
              </div>
              <span>{actionMessage || "Processing..."}</span>
            </div>
          </div>
        </div>
      )}

      {/* Check Status */}
      {checkStatus && (
        <div className={`mx-4 mb-4 p-3 rounded-xl text-sm ${
          checkStatus === "polling" ? "bg-purple-950/50 text-purple-300 border border-purple-700" :
          checkStatus === "passed" ? "bg-emerald-950/50 text-emerald-300 border border-emerald-700" :
          "bg-red-950/50 text-red-300 border border-red-700"
        }`}>
          {checkStatus === "polling" && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="animate-spin">🔮</span>
                Ritual circle active... polling checks
              </span>
              <button
                onClick={cancelPolling}
                className="text-xs text-purple-400 hover:text-purple-300 underline"
              >
                Cancel
              </button>
            </div>
          )}
          {checkStatus === "passed" && "✓ All checks passed! The spirits are pleased."}
          {checkStatus === "failed" && !pollError && "⚠️ Some checks failed. The ritual requires attention."}
          {checkStatus === "failed" && pollError && (
            <div className="flex items-center justify-between">
              <span>⚠️ {pollError}</span>
              <a
                href={`https://github.com/${repoName}/pull/${prNumber}/checks`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-red-400 hover:text-red-300 underline ml-2"
              >
                View on GitHub →
              </a>
            </div>
          )}
          {checkStatus === "timeout" && "⏱️ Check polling timed out after 2 minutes. Check GitHub for status."}
        </div>
      )}

      {/* Actions */}
      <div className="p-4 border-t border-gray-800 bg-gray-900/50">
        {mode === "safe" ? (
          <div className="flex gap-3">
            <button
              onClick={handleRealComment}
              disabled={actionStatus === "loading"}
              className="
                flex-1 py-3 px-4 rounded-xl font-medium
                bg-purple-900/50 text-purple-300 border border-purple-700
                hover:bg-purple-900/70 transition-all disabled:opacity-50
                focus:outline-none focus:ring-2 focus:ring-purple-500
              "
            >
              💬 Post Comment
            </button>
            <div className="flex-1 relative group">
              <button
                onClick={handleRealRequestChanges}
                disabled={actionStatus === "loading" || !canRequestChanges()}
                className="
                  w-full py-3 px-4 rounded-xl font-medium
                  bg-amber-900/50 text-amber-300 border border-amber-700
                  hover:bg-amber-900/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                  focus:outline-none focus:ring-2 focus:ring-amber-500
                "
              >
                ✋ Request Changes
              </button>
              {!canRequestChanges() && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-800 text-xs text-gray-300 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Connect to GitHub to enable
                </div>
              )}
            </div>
          </div>
        ) : mode === "approve" ? (
          <div className="relative group">
            <button
              onClick={handleRealApprove}
              disabled={actionStatus === "loading" || !canApprove()}
              className="
                w-full py-3 px-4 rounded-xl font-medium
                bg-emerald-900/50 text-emerald-300 border border-emerald-700
                hover:bg-emerald-900/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-emerald-500
              "
            >
              ✓ Approve PR
            </button>
            {!canApprove() && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-800 text-xs text-gray-300 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Connect to GitHub to enable
              </div>
            )}
          </div>
        ) : (
          <div className="relative group">
            <button
              onClick={handleApplyPatch}
              disabled={patchStaged || !hunk.patchPreview || actionStatus === "loading" || !canApplyPatch()}
              className={`
                w-full py-3 px-4 rounded-xl font-medium transition-all
                focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed
                ${patchStaged 
                  ? "bg-emerald-900/50 text-emerald-300 border border-emerald-700"
                  : patchConfirmed
                    ? "bg-red-900/50 text-red-300 border border-red-700 hover:bg-red-900/70"
                    : "bg-amber-900/50 text-amber-300 border border-amber-700 hover:bg-amber-900/70"
                }
              `}
            >
              {patchStaged 
                ? "✓ Patch Applied" 
                : patchConfirmed 
                  ? "⚠️ Confirm Apply" 
                  : "⚡ Apply Patch"
              }
            </button>
            {!canApplyPatch() && !patchStaged && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-800 text-xs text-gray-300 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Connect to GitHub to apply patches
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
