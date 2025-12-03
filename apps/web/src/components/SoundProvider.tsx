"use client";

import { createContext, useContext, useCallback, useRef, ReactNode } from "react";
import { useSpectral } from "@/lib/store";

type SoundType = "creak" | "match" | "whoosh" | "seal";

interface SoundContextType {
  play: (sound: SoundType) => void;
}

const SoundContext = createContext<SoundContextType | null>(null);

// WebAudio synthesis parameters for each sound
const SOUND_PARAMS: Record<SoundType, { freq: number; duration: number; type: OscillatorType; throttleMs: number }> = {
  creak: { freq: 80, duration: 0.15, type: "sawtooth", throttleMs: 400 },  // Throttle hover sounds
  match: { freq: 2000, duration: 0.05, type: "sine", throttleMs: 100 },
  whoosh: { freq: 400, duration: 0.1, type: "sine", throttleMs: 150 },
  seal: { freq: 600, duration: 0.2, type: "triangle", throttleMs: 200 },
};

export function SoundProvider({ children }: { children: ReactNode }) {
  const { soundEnabled, reduceEffects } = useSpectral();
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastPlayedRef = useRef<Map<SoundType, number>>(new Map());

  // Get or create AudioContext
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      } catch {
        return null;
      }
    }
    return audioContextRef.current;
  }, []);

  // Play using WebAudio API (oscillator-based synthesis)
  const play = useCallback((sound: SoundType) => {
    if (!soundEnabled || reduceEffects) return;

    const params = SOUND_PARAMS[sound];
    const now = Date.now();
    const lastPlayed = lastPlayedRef.current.get(sound) || 0;

    // Throttle to prevent sound spam (especially on hover)
    if (now - lastPlayed < params.throttleMs) return;
    lastPlayedRef.current.set(sound, now);

    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = params.type;
      oscillator.frequency.setValueAtTime(params.freq, ctx.currentTime);
      
      // Quick fade out for natural sound
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + params.duration);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + params.duration);
    } catch {
      // Silently fail - audio is optional
    }
  }, [soundEnabled, reduceEffects, getAudioContext]);

  return (
    <SoundContext.Provider value={{ play }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) {
    throw new Error("useSound must be used within SoundProvider");
  }
  return ctx;
}
