"use client";

import { useMemo } from "react";
import { useSpectral } from "@/lib/store";
import { Hunk, FileChange } from "@/lib/types";
import { computeRoomRisk, RoomRiskResult } from "@/lib/risk";

interface LanternOverlayProps {
  file: FileChange;
  hunk: Hunk;
  currentHunkNum: number;
  totalHunks: number;
  currentRoomNum: number;
  totalRooms: number;
  onNext: () => void;
  onPrev: () => void;
  onExorcise: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  riskResult?: RoomRiskResult;
}

export function LanternOverlay({
  file,
  hunk,
  currentHunkNum,
  totalHunks,
  currentRoomNum,
  totalRooms,
  onNext,
  onPrev,
  onExorcise,
  hasNext,
  hasPrev,
  riskResult: precomputedRisk,
}: LanternOverlayProps) {
  const { reduceEffects } = useSpectral();
  
  // Compute risk if not provided
  const riskResult = useMemo(() => {
    return precomputedRisk || computeRoomRisk(file);
  }, [file, precomputedRisk]);
  
  const { score, band, signals, criticalFindings } = riskResult;

  return (
    <div className="relative">
      {/* Lantern cone effect */}
      {!reduceEffects && (
        <div 
          className="absolute -inset-8 pointer-events-none"
          style={{
            background: `
              radial-gradient(
                ellipse 100% 120% at 50% 0%,
                rgba(251, 191, 36, 0.08) 0%,
                rgba(251, 191, 36, 0.03) 40%,
                transparent 70%
              )
            `,
          }}
        />
      )}

      {/* Main content card */}
      <div className={`
        relative bg-gray-900/95 rounded-2xl border border-gray-800
        shadow-2xl shadow-amber-900/10
        overflow-hidden
        ${!reduceEffects ? "animate-fade-in" : ""}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-800 bg-gray-900/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔦</span>
              <span className="font-mono text-sm text-gray-300">{file.path}</span>
              {/* Risk badge with tooltip showing top signals */}
              <span 
                className={`
                  px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider cursor-help
                  border border-current/20
                ${band === "cursed" ? "bg-red-950/90 text-red-300 shadow-lg shadow-red-900/30" : 
                  band === "dark" ? "bg-amber-950/80 text-amber-300" : 
                  band === "dim" ? "bg-purple-950/80 text-purple-300" :
                  "bg-gray-900/80 text-gray-400"}
              `}
                title={`Risk: ${score} (${band})\n${signals.slice(0, 2).map(s => `• ${s.label}: +${s.points}`).join("\n") || "No signals"}`}
              >
                Risk {score}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="px-2 py-1 bg-gray-800 rounded-lg">
                Room {currentRoomNum}/{totalRooms}
              </span>
              <span className="px-2 py-1 bg-purple-900/50 text-purple-300 rounded-lg">
                Hunk {currentHunkNum}/{totalHunks}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-gray-500">{hunk.header}</span>
            {signals.length > 0 && (
              <span className="text-xs text-gray-500">⚡{signals.length} signals</span>
            )}
          </div>
        </div>
        
        {/* Critical findings banner */}
        {criticalFindings.length > 0 && (
          <div className="px-4 py-2 bg-red-950/50 border-b border-red-900/30">
            <div className="flex items-center gap-2 text-sm text-red-300">
              <span>💀</span>
              <span className="font-medium">Critical:</span>
              <span>{criticalFindings[0]}</span>
              {criticalFindings.length > 1 && (
                <span className="text-red-400/70">+{criticalFindings.length - 1} more</span>
              )}
            </div>
          </div>
        )}

        {/* Diff content */}
        <div className="p-4 max-h-96 overflow-y-auto">
          <pre className="font-mono text-sm leading-relaxed">
            {hunk.diffText.split("\n").map((line, i) => {
              const isAdded = line.startsWith("+");
              const isRemoved = line.startsWith("-");
              
              return (
                <div
                  key={i}
                  className={`
                    px-2 py-0.5 -mx-2 rounded
                    ${isAdded 
                      ? "bg-emerald-900/30 text-emerald-300 border-l-2 border-emerald-500" 
                      : isRemoved 
                        ? "bg-red-900/20 text-red-300/70 border-l-2 border-red-500/50" 
                        : "text-gray-400"
                    }
                  `}
                >
                  {line || " "}
                </div>
              );
            })}
          </pre>
        </div>

        {/* Red flags */}
        {hunk.redFlags.length > 0 && (
          <div className="px-4 pb-4">
            <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-xl">
              <h4 className="text-xs font-semibold text-red-400 mb-2">⚠️ Red Flags</h4>
              <ul className="space-y-1">
                {hunk.redFlags.map((flag, i) => (
                  <li key={i} className="text-sm text-red-300/80">{flag}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/50 flex items-center justify-between">
          <button
            onClick={onPrev}
            disabled={!hasPrev}
            className={`
              px-4 py-2 rounded-xl font-medium transition-all
              focus:outline-none focus:ring-2 focus:ring-purple-500
              ${hasPrev 
                ? "bg-gray-800 text-gray-200 hover:bg-gray-700" 
                : "bg-gray-800/50 text-gray-600 cursor-not-allowed"
              }
            `}
            aria-label="Previous hunk (P)"
          >
            <span className="mr-2">←</span>
            <span className="hidden sm:inline">Prev</span>
            <kbd className="ml-2 text-xs text-gray-500 hidden sm:inline">P</kbd>
          </button>

          <button
            onClick={onExorcise}
            className="
              px-6 py-2 rounded-xl font-medium
              bg-gradient-to-r from-purple-600 to-purple-700
              hover:from-purple-500 hover:to-purple-600
              text-white shadow-lg shadow-purple-900/30
              transition-all
              focus:outline-none focus:ring-2 focus:ring-purple-400
            "
            aria-label="Exorcise this hunk (C)"
          >
            ⚗️ Exorcise
            <kbd className="ml-2 text-xs text-purple-300/70 hidden sm:inline">C</kbd>
          </button>

          <button
            onClick={onNext}
            disabled={!hasNext}
            className={`
              px-4 py-2 rounded-xl font-medium transition-all
              focus:outline-none focus:ring-2 focus:ring-purple-500
              ${hasNext 
                ? "bg-gray-800 text-gray-200 hover:bg-gray-700" 
                : "bg-gray-800/50 text-gray-600 cursor-not-allowed"
              }
            `}
            aria-label="Next hunk (N)"
          >
            <span className="hidden sm:inline">Next</span>
            <kbd className="mx-2 text-xs text-gray-500 hidden sm:inline">N</kbd>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-1 bg-gray-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-purple-600 to-amber-500 transition-all duration-300"
          style={{ width: `${(currentHunkNum / totalHunks) * 100}%` }}
        />
      </div>
    </div>
  );
}
