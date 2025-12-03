"use client";

import { useState, useMemo } from "react";
import { FileChange } from "@/lib/types";
import { useSpectral } from "@/lib/store";
import { useSound } from "./SoundProvider";
import { FogLayer } from "./FogLayer";
import { computeRoomRisk, riskToVisual, getFogIntensityValue, RoomRiskResult, RiskVisual } from "@/lib/risk";

interface RoomTileProps {
  file: FileChange;
  onClick: () => void;
  isSelected?: boolean;
  riskResult?: RoomRiskResult; // Optional pre-computed risk
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

export function RoomTile({ file, onClick, isSelected, riskResult: precomputedRisk }: RoomTileProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { reduceEffects } = useSpectral();
  const { play } = useSound();

  // Compute risk using the engine (or use pre-computed)
  const riskResult = useMemo(() => {
    return precomputedRisk || computeRoomRisk(file);
  }, [file, precomputedRisk]);
  
  const visual = useMemo(() => riskToVisual(riskResult), [riskResult]);
  
  const { score, band, signals, criticalFindings } = riskResult;
  const langIcon = LANGUAGE_ICONS[file.language] || LANGUAGE_ICONS.default;
  
  // Calculate darkness based on computed risk score
  const bgLightness = Math.max(5, 22 - (score / 100) * 18);
  
  // Glow color based on band
  const glowColor = band === "cursed" 
    ? "rgba(220, 38, 38, 0.4)" 
    : band === "dark"
      ? "rgba(234, 179, 8, 0.3)" 
      : band === "dim"
        ? "rgba(139, 92, 246, 0.2)"
        : "rgba(139, 92, 246, 0.1)";

  const handleMouseEnter = () => {
    setIsHovered(true);
    // Only creak for dark/cursed rooms (band-based, not arbitrary score)
    if (band === "dark" || band === "cursed") {
      play("creak");
    }
  };

  // Calculate scratch lines (visual representation of changes)
  const totalChanges = file.hunks.reduce((sum, h) => sum + h.added + h.removed + h.modified, 0);
  const addedRatio = file.hunks.reduce((sum, h) => sum + h.added, 0) / Math.max(totalChanges, 1);
  const removedRatio = file.hunks.reduce((sum, h) => sum + h.removed, 0) / Math.max(totalChanges, 1);
  const modifiedRatio = file.hunks.reduce((sum, h) => sum + h.modified, 0) / Math.max(totalChanges, 1);

  const hasCritical = criticalFindings.length > 0;
  const signalCount = signals.length;

  return (
    <button
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative w-full aspect-square rounded-2xl overflow-hidden
        transition-all duration-300 ease-out
        focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-950
        ${isSelected ? "ring-2 ring-purple-400 scale-105" : ""}
        ${isHovered && !reduceEffects ? "scale-105 z-10" : ""}
        ${visual.distortion && !reduceEffects ? "animate-pulse-glow" : ""}
      `}
      style={{
        backgroundColor: `hsl(250, 15%, ${bgLightness}%)`,
        boxShadow: isHovered || isSelected 
          ? `0 0 30px ${glowColor}, inset 0 0 20px rgba(0,0,0,0.5)` 
          : `inset 0 0 20px rgba(0,0,0,0.5)${band === "cursed" ? ", 0 0 15px rgba(220, 38, 38, 0.2)" : ""}`,
      }}
      aria-label={`${file.path}, risk score ${score}, band ${band}, ${file.locChanged} lines changed, ${signalCount} signals${hasCritical ? ", has critical findings" : ""}`}
    >
      {/* Scratches visualization */}
      <div className="absolute inset-0 p-3">
        <Scratches 
          added={addedRatio} 
          removed={removedRatio} 
          modified={modifiedRatio}
          scratchStyle={visual.scratchStyle}
          reduceEffects={reduceEffects}
        />
      </div>

      {/* Fog overlay - intensity from risk engine */}
      <FogLayer 
        intensity={getFogIntensityValue(visual.fogIntensity)} 
        revealed={isHovered} 
      />

      {/* Distortion overlay for cursed rooms */}
      {visual.distortion && !reduceEffects && (
        <div 
          className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-30"
          style={{
            background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(220, 38, 38, 0.1) 2px, rgba(220, 38, 38, 0.1) 4px)"
          }}
        />
      )}

      {/* Door plaque */}
      <div className={`
        absolute bottom-0 left-0 right-0 p-3
        bg-gradient-to-t from-gray-900/95 via-gray-900/80 to-transparent
        transition-opacity duration-300
        ${isHovered ? "opacity-100" : "opacity-80"}
      `}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{langIcon}</span>
          <span className="text-xs font-mono text-gray-300 truncate flex-1">
            {file.path.split("/").pop()}
          </span>
        </div>
        
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className={file.locChanged > 500 ? "text-amber-400" : ""}>
            {file.locChanged} LOC
          </span>
          
          {file.testsTouched && (
            <span className="text-emerald-400" title="Tests touched">✓ tests</span>
          )}
          
          {!file.checksPassing && (
            <span className="text-red-400" title="Checks failing">✗ CI</span>
          )}
          
          {signalCount > 0 && (
            <span className="text-gray-400" title={`${signalCount} risk signals`}>
              ⚡{signalCount}
            </span>
          )}
        </div>
      </div>

      {/* Risk score badge - artifact tag style */}
      <div 
        className={`
          absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
          border border-current/20
          ${band === "cursed" ? "bg-red-950/90 text-red-300 shadow-lg shadow-red-900/30" : 
            band === "dark" ? "bg-amber-950/80 text-amber-300" : 
            band === "dim" ? "bg-purple-950/80 text-purple-300" : 
            "bg-gray-900/80 text-gray-400"}
        `}
        title={`Risk: ${score} (${band})\nTop signals: ${signals.slice(0, 2).map(s => `${s.label} +${s.points}`).join(", ") || "none"}`}
      >
        Risk {score}
      </div>

      {/* Critical sigil with count */}
      {hasCritical && (
        <div 
          className={`
            absolute top-2 left-2 flex items-center gap-1
            ${!reduceEffects ? "animate-pulse" : ""}
          `}
          title={criticalFindings.join("\n")}
        >
          <span className="text-xl">💀</span>
          {criticalFindings.length > 1 && (
            <span className="text-[10px] font-bold text-red-400 bg-red-950/80 px-1 rounded">
              {criticalFindings.length}
            </span>
          )}
        </div>
      )}
      
      {/* Warning sigil for dark rooms without critical */}
      {!hasCritical && visual.sigils.some(s => s.type === "warning") && (
        <div 
          className="absolute top-2 left-2 text-lg"
          title={visual.sigils.find(s => s.type === "warning")?.label}
        >
          ⚠️
        </div>
      )}
    </button>
  );
}

function Scratches({ 
  added, 
  removed, 
  modified,
  scratchStyle,
  reduceEffects 
}: { 
  added: number; 
  removed: number; 
  modified: number;
  scratchStyle: RiskVisual["scratchStyle"];
  reduceEffects: boolean;
}) {
  // Generate deterministic scratch positions
  const scratches = [];
  const total = Math.ceil((added + removed + modified) * 8);
  
  // Adjust scratch count based on style
  const maxScratches = scratchStyle === "small" ? 6 : 
                       scratchStyle === "medium" ? 10 : 14;
  
  for (let i = 0; i < Math.min(total, maxScratches); i++) {
    const type = i < added * 8 ? "added" : i < (added + removed) * 8 ? "removed" : "modified";
    const angle = (i * 37 + 15) % 60 - 30;
    const top = (i * 23 + 10) % 70 + 10;
    const left = (i * 31 + 5) % 60 + 15;
    
    // Width varies by scratch style
    const baseWidth = scratchStyle === "small" ? 15 : 
                      scratchStyle === "medium" ? 22 : 30;
    const width = baseWidth + (i % 4) * 8;
    
    // Height varies by style
    const height = scratchStyle === "bleed" ? "h-1" : "h-0.5";
    
    // Animation for pulse/bleed styles
    const shouldAnimate = !reduceEffects && 
      (scratchStyle === "pulse" || scratchStyle === "bleed");
    
    scratches.push(
      <div
        key={i}
        className={`
          absolute ${height} rounded-full
          ${type === "added" ? "bg-emerald-400/60" : 
            type === "removed" ? "bg-gray-500/40" : 
            "bg-amber-400/50"}
          ${shouldAnimate ? "animate-scratch-shimmer" : ""}
        `}
        style={{
          top: `${top}%`,
          left: `${left}%`,
          width: `${width}%`,
          transform: `rotate(${angle}deg)`,
          boxShadow: type === "added" 
            ? `0 0 ${scratchStyle === "bleed" ? "12" : "8"}px rgba(52, 211, 153, 0.5)` 
            : type === "modified" 
              ? `0 0 ${scratchStyle === "bleed" ? "10" : "6"}px rgba(251, 191, 36, 0.4)` 
              : "none",
          animationDelay: shouldAnimate ? `${i * 0.15}s` : undefined,
        }}
      />
    );
  }

  return <>{scratches}</>;
}
