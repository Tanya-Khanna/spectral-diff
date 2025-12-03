"use client";

import { useSpectral } from "@/lib/store";

export function ModeBanner() {
  const { mode, error } = useSpectral();
  
  if (error) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-red-900/95 border-b border-red-700 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-red-300">⚠️</span>
            <span className="text-sm text-red-200">{error}</span>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`fixed top-0 left-0 right-0 z-50 px-4 py-1.5 border-b ${
      mode === "demo" 
        ? "bg-amber-900/90 border-amber-700" 
        : "bg-emerald-900/90 border-emerald-700"
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
        <span className={`text-xs font-bold uppercase tracking-wider ${
          mode === "demo" ? "text-amber-300" : "text-emerald-300"
        }`}>
          {mode === "demo" ? "👻 Demo Mode" : "🔗 Live Mode"}
        </span>
        {mode === "demo" && (
          <span className="text-xs text-amber-400/70">
            — Destructive actions disabled. Connect GitHub for real reviews.
          </span>
        )}
        {mode === "real" && (
          <span className="text-xs text-emerald-400/70">
            — Connected to GitHub. Actions will affect the real PR.
          </span>
        )}
      </div>
    </div>
  );
}
