"use client";

import { useState, useMemo } from "react";
import { FileChange } from "@/lib/types";
import { useSpectral } from "@/lib/store";
import { computeRoomRisk, RoomRiskResult } from "@/lib/risk";

interface DiffMuralPanelProps {
  file: FileChange;
  onClose: () => void;
  onStartLantern: () => void;
  onSelectHunk: (hunkId: string) => void;
  riskResult?: RoomRiskResult;
}

const LANGUAGE_ICONS: Record<string, string> = {
  typescript: "📘",
  tsx: "⚛️",
  javascript: "📒",
  css: "🎨",
  markdown: "📝",
  json: "📋",
  yaml: "⚙️",
  default: "📄",
};

export function DiffMuralPanel({ file, onClose, onStartLantern, onSelectHunk, riskResult: precomputedRisk }: DiffMuralPanelProps) {
  const { reduceEffects } = useSpectral();
  const [riskExpanded, setRiskExpanded] = useState(true);
  
  // Compute risk if not provided
  const riskResult = useMemo(() => {
    return precomputedRisk || computeRoomRisk(file);
  }, [file, precomputedRisk]);
  
  const { score, band, signals, criticalFindings, notes } = riskResult;
  const langIcon = LANGUAGE_ICONS[file.language] || LANGUAGE_ICONS.default;

  return (
    <div 
      className={`
        fixed right-0 top-24 bottom-0 w-full max-w-lg
        bg-gray-900/95 backdrop-blur-md border-l border-gray-800
        shadow-2xl shadow-purple-900/20
        overflow-hidden flex flex-col
        ${!reduceEffects ? "animate-slide-in-right" : ""}
      `}
      role="dialog"
      aria-label={`Diff details for ${file.path}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gray-900/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{langIcon}</span>
            <div>
              <h2 className="font-mono text-sm text-gray-200">{file.path}</h2>
              <p className="text-xs text-gray-500">{file.language}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label="Close panel"
          >
            ✕
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className={`
            px-3 py-1 rounded-full font-bold
            ${band === "cursed" ? "bg-red-900/70 text-red-200 ring-1 ring-red-500/50" : 
              band === "dark" ? "bg-amber-900/50 text-amber-300" : 
              band === "dim" ? "bg-purple-900/50 text-purple-300" :
              "bg-gray-700/50 text-gray-300"}
          `}>
            Risk: {score}
          </div>
          <span className="text-gray-400">{file.locChanged} LOC</span>
          <span className={file.testsTouched ? "text-emerald-400" : "text-gray-500"}>
            {file.testsTouched ? "✓ Tests" : "○ No tests"}
          </span>
          <span className={file.checksPassing ? "text-emerald-400" : "text-red-400"}>
            {file.checksPassing ? "✓ CI" : "✗ CI"}
          </span>
        </div>
      </div>
      
      {/* Risk Breakdown Accordion */}
      <div className="border-b border-gray-800">
        <button
          onClick={() => setRiskExpanded(!riskExpanded)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-800/30 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-inset"
          aria-expanded={riskExpanded}
        >
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <span>📊</span> Risk Breakdown
            <span className={`
              px-1.5 py-0.5 rounded text-[10px]
              ${band === "cursed" ? "bg-red-900/50 text-red-300" : "bg-gray-700 text-gray-400"}
            `}>
              {signals.length} signals
            </span>
          </span>
          <span className="text-gray-500">{riskExpanded ? "▼" : "▶"}</span>
        </button>
        
        {riskExpanded && (
          <div className="px-4 pb-4 space-y-3">
            {/* Critical Findings */}
            {criticalFindings.length > 0 && (
              <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl">
                <h4 className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-1">
                  <span>💀</span> Critical Findings
                </h4>
                <ul className="space-y-1">
                  {criticalFindings.map((finding, i) => (
                    <li key={i} className="text-sm text-red-300">{finding}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Signals List */}
            <div className="space-y-2">
              {signals.map((signal, i) => (
                <div 
                  key={i}
                  className={`
                    flex items-center justify-between p-2 rounded-lg
                    ${signal.severity === "critical" ? "bg-red-950/30 border border-red-900/30" :
                      signal.severity === "warn" ? "bg-amber-950/20 border border-amber-900/20" :
                      "bg-gray-800/30 border border-gray-700/30"}
                  `}
                >
                  <span className={`text-sm ${
                    signal.severity === "critical" ? "text-red-300" :
                    signal.severity === "warn" ? "text-amber-300" :
                    "text-gray-400"
                  }`}>
                    {signal.label}
                  </span>
                  <span className={`text-xs font-mono font-bold ${
                    signal.severity === "critical" ? "text-red-400" :
                    signal.severity === "warn" ? "text-amber-400" :
                    "text-gray-500"
                  }`}>
                    +{signal.points}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Notes */}
            {notes.length > 0 && (
              <div className="text-xs text-gray-500 space-y-1 pt-2 border-t border-gray-800">
                {notes.map((note, i) => (
                  <p key={i}>💡 {note}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hunks list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Hunks ({file.hunks.length})
        </h3>
        
        {file.hunks.map((hunk) => (
          <button
            key={hunk.id}
            onClick={() => onSelectHunk(hunk.id)}
            className="
              w-full text-left p-3 rounded-xl
              bg-gray-800/50 hover:bg-gray-800 
              border border-gray-700/50 hover:border-purple-700/50
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-purple-500
            "
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-gray-400">{hunk.header}</span>
              <span className={`
                text-xs px-2 py-0.5 rounded-full
                ${hunk.importance > 70 ? "bg-red-900/50 text-red-300" : 
                  hunk.importance > 40 ? "bg-amber-900/50 text-amber-300" : 
                  "bg-gray-700/50 text-gray-400"}
              `}>
                {hunk.importance}
              </span>
            </div>
            
            <div className="flex items-center gap-3 text-xs">
              <span className="text-emerald-400">+{hunk.added}</span>
              <span className="text-red-400">-{hunk.removed}</span>
              {hunk.modified > 0 && (
                <span className="text-amber-400">~{hunk.modified}</span>
              )}
              {hunk.redFlags.length > 0 && (
                <span className="text-red-400 ml-auto">
                  {hunk.redFlags.length} flag{hunk.redFlags.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-800 bg-gray-900/50">
        <button
          onClick={onStartLantern}
          className="
            w-full py-3 px-4 rounded-xl
            bg-gradient-to-r from-purple-600 to-purple-700
            hover:from-purple-500 hover:to-purple-600
            text-white font-medium
            shadow-lg shadow-purple-900/30
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-900
          "
        >
          🔦 Start Lantern Run
        </button>
      </div>
    </div>
  );
}
