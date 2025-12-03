"use client";

import { useSpectral } from "@/lib/store";

interface FogLayerProps {
  intensity?: number; // 0-100, higher = more fog
  revealed?: boolean;
  className?: string;
}

export function FogLayer({ intensity = 50, revealed = false, className = "" }: FogLayerProps) {
  const { reduceEffects } = useSpectral();
  
  if (reduceEffects) {
    // Simple opacity overlay for reduced effects mode
    return (
      <div 
        className={`absolute inset-0 bg-gray-900 pointer-events-none transition-opacity duration-300 ${className}`}
        style={{ opacity: revealed ? 0 : intensity / 200 }}
      />
    );
  }

  const fogOpacity = revealed ? 0 : Math.min(intensity / 100, 0.7);

  return (
    <div 
      className={`absolute inset-0 pointer-events-none transition-all duration-500 ${className}`}
      style={{ opacity: fogOpacity }}
    >
      {/* Base fog */}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/40 to-transparent" />
      
      {/* Animated fog wisps */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute w-full h-full animate-fog-drift"
          style={{
            background: `
              radial-gradient(ellipse 100% 50% at 20% 80%, rgba(30, 30, 40, 0.6) 0%, transparent 50%),
              radial-gradient(ellipse 80% 40% at 70% 60%, rgba(40, 40, 50, 0.5) 0%, transparent 50%),
              radial-gradient(ellipse 60% 30% at 40% 40%, rgba(35, 35, 45, 0.4) 0%, transparent 50%)
            `
          }}
        />
      </div>
      
      {/* Vignette */}
      <div 
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 30%, rgba(10, 10, 15, 0.5) 100%)"
        }}
      />
    </div>
  );
}
