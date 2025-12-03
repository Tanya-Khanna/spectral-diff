// Risk score to visual mapping

import { RoomRiskResult, RiskVisual, Band, FogIntensity, ScratchStyle, RiskSigil } from "./types";

/**
 * Convert risk result to visual properties
 * 
 * Bands:
 * - 0-20: bright room, small scratches
 * - 20-50: dim room, visible fog, medium scratches
 * - 50-80: very dark, scratches pulse, warning sigils
 * - 80-100: cursed room (distortion + heavy fog)
 */
export function riskToVisual(risk: RoomRiskResult): RiskVisual {
  const { score, band, signals, criticalFindings } = risk;
  
  // Determine fog intensity
  const fogIntensity = getFogIntensity(band);
  
  // Determine scratch style
  const scratchStyle = getScratchStyle(band);
  
  // Determine darkness class (Tailwind-compatible)
  const darknessClass = getDarknessClass(band, score);
  
  // Build sigils
  const sigils = buildSigils(band, signals, criticalFindings);
  
  // Distortion only for cursed rooms
  const distortion = band === "cursed";
  
  return {
    band,
    darknessClass,
    fogIntensity,
    scratchStyle,
    sigils,
    distortion,
  };
}

function getFogIntensity(band: Band): FogIntensity {
  switch (band) {
    case "bright": return "none";
    case "dim": return "low";
    case "dark": return "med";
    case "cursed": return "high";
  }
}

function getScratchStyle(band: Band): ScratchStyle {
  switch (band) {
    case "bright": return "small";
    case "dim": return "medium";
    case "dark": return "pulse";
    case "cursed": return "bleed";
  }
}

function getDarknessClass(band: Band, score: number): string {
  // Returns Tailwind-compatible class names for background darkness
  switch (band) {
    case "bright":
      return "bg-gray-800/40";
    case "dim":
      return "bg-gray-900/60";
    case "dark":
      return "bg-gray-950/80";
    case "cursed":
      // Extra dark with slight red tint
      return "bg-gray-950/95";
  }
}

function buildSigils(
  band: Band,
  signals: RoomRiskResult["signals"],
  criticalFindings: string[]
): RiskSigil[] {
  const sigils: RiskSigil[] = [];
  
  // Critical sigils for workflow findings
  const hasCriticalSignals = signals.some(s => s.severity === "critical");
  if (hasCriticalSignals || criticalFindings.length > 0) {
    sigils.push({
      type: "critical",
      label: criticalFindings[0] || "Critical issue",
    });
  }
  
  // Warning sigils for dark rooms (50-80)
  if (band === "dark" || band === "cursed") {
    const warnSignals = signals.filter(s => s.severity === "warn");
    if (warnSignals.length > 0 && sigils.length === 0) {
      sigils.push({
        type: "warning",
        label: warnSignals[0].label,
      });
    }
  }
  
  return sigils;
}

/**
 * Get CSS variables for room styling based on risk
 */
export function getRiskCSSVars(risk: RoomRiskResult): Record<string, string> {
  const { score, band } = risk;
  
  // Background lightness (lower = darker)
  const bgLightness = Math.max(5, 25 - (score / 100) * 20);
  
  // Glow color based on band
  const glowColor = band === "cursed" 
    ? "rgba(220, 38, 38, 0.4)"  // red
    : band === "dark"
      ? "rgba(234, 179, 8, 0.3)"  // amber
      : band === "dim"
        ? "rgba(139, 92, 246, 0.2)"  // purple
        : "rgba(139, 92, 246, 0.1)";  // faint purple
  
  // Fog opacity
  const fogOpacity = band === "cursed" ? "0.7" 
    : band === "dark" ? "0.5"
    : band === "dim" ? "0.3"
    : "0.1";
  
  return {
    "--room-bg-lightness": `${bgLightness}%`,
    "--room-glow-color": glowColor,
    "--room-fog-opacity": fogOpacity,
  };
}

/**
 * Get animation classes based on risk visual
 */
export function getRiskAnimationClasses(visual: RiskVisual, reduceEffects: boolean): string {
  if (reduceEffects) return "";
  
  const classes: string[] = [];
  
  if (visual.scratchStyle === "pulse") {
    classes.push("animate-scratch-shimmer");
  }
  
  if (visual.scratchStyle === "bleed") {
    classes.push("animate-scratch-shimmer");
  }
  
  if (visual.distortion) {
    classes.push("animate-pulse-glow");
  }
  
  return classes.join(" ");
}

/**
 * Get fog intensity as a number (0-100) for FogLayer component
 */
export function getFogIntensityValue(intensity: FogIntensity): number {
  switch (intensity) {
    case "none": return 10;
    case "low": return 30;
    case "med": return 55;
    case "high": return 80;
  }
}
