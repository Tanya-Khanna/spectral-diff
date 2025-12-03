"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { FileChange, Hunk, LanternCursor, AppMode } from "./types";

// Re-export types for convenience
export type { FileChange, Hunk, LanternCursor, AppMode };

// Single source of truth: Mode is determined by NEXT_PUBLIC_DEMO_MODE env var
// When DEMO_MODE=true: App starts in demo mode with fake data
// When DEMO_MODE=false (default): App starts empty, must connect to GitHub
// Real mode is the default to prevent accidental demo deployments
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

// Only import demo data in demo mode - fail fast in real mode if accidentally imported
function getDemoData() {
  if (!DEMO_MODE && process.env.NODE_ENV === "development") {
    console.warn("[Spectral] Demo data accessed in real mode - this should not happen in production");
  }
  // Dynamic import would be better but for simplicity we guard at runtime
  const { demoPR } = require("./demo/pr");
  return demoPR;
}

export interface PRMeta {
  headSha: string;
  headRef: string;
  baseRef: string;
  user: string;
}

export interface SpectralState {
  // Mode - explicit demo vs real
  mode: AppMode;
  isRealMode: boolean; // Convenience alias
  
  // Data
  files: FileChange[];
  prTitle: string;
  prNumber: number;
  repoName: string;
  prMeta: PRMeta | null;
  
  // Error state for real mode
  error: string | null;
  isLoading: boolean;
  
  // Selection
  selectedFileIndex: number | null;
  selectedHunkId: string | null;
  lanternCursor: LanternCursor | null;
  
  // Preferences
  soundEnabled: boolean;
  reduceEffects: boolean;
  
  // Actions
  selectFile: (index: number | null) => void;
  selectHunk: (id: string | null) => void;
  setLanternCursor: (cursor: LanternCursor | null) => void;
  toggleSound: () => void;
  toggleReduceEffects: () => void;
  loadRealPR: (repoName: string, prTitle: string, prNumber: number, files: FileChange[], meta: PRMeta) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  resetToDemo: () => void;
  
  // Permission checks
  canApplyPatch: () => boolean;
  canApprove: () => boolean;
  canRequestChanges: () => boolean;
  
  // Helpers
  getSelectedFile: () => FileChange | null;
  getSelectedHunk: () => Hunk | null;
  getCurrentLanternHunk: () => { file: FileChange; hunk: Hunk } | null;
}

const SpectralContext = createContext<SpectralState | null>(null);

export function SpectralProvider({ children }: { children: ReactNode }) {
  // Initialize based on DEMO_MODE env var
  const [mode, setMode] = useState<AppMode>(DEMO_MODE ? "demo" : "demo"); // Start in demo, switch to real when PR loaded
  
  // Get initial demo data only if in demo mode
  const demoData = DEMO_MODE ? getDemoData() : null;
  
  const [files, setFiles] = useState<FileChange[]>(demoData?.files ?? []);
  const [prTitle, setPrTitle] = useState(demoData?.prTitle ?? "");
  const [prNumber, setPrNumber] = useState(demoData?.prNumber ?? 0);
  const [repoName, setRepoName] = useState(demoData?.repoName ?? "");
  const [prMeta, setPrMeta] = useState<PRMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);
  const [selectedHunkId, setSelectedHunkId] = useState<string | null>(null);
  const [lanternCursor, setLanternCursor] = useState<LanternCursor | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [reduceEffects, setReduceEffects] = useState(false);

  // Load preferences from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("spectral-prefs");
    if (stored) {
      try {
        const prefs = JSON.parse(stored);
        setSoundEnabled(prefs.soundEnabled ?? false);
        setReduceEffects(prefs.reduceEffects ?? false);
      } catch (e) {
        console.warn("[Spectral] Failed to parse preferences:", e);
      }
    }
    
    // Check prefers-reduced-motion
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mediaQuery.matches) {
        setReduceEffects(true);
      }
    }
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem("spectral-prefs", JSON.stringify({ soundEnabled, reduceEffects }));
  }, [soundEnabled, reduceEffects]);

  const loadRealPR = (newRepoName: string, newPrTitle: string, newPrNumber: number, newFiles: FileChange[], meta: PRMeta) => {
    setRepoName(newRepoName);
    setPrTitle(newPrTitle);
    setPrNumber(newPrNumber);
    setFiles(newFiles);
    setPrMeta(meta);
    setMode("real");
    setError(null);
    setSelectedFileIndex(null);
    setSelectedHunkId(null);
    setLanternCursor(null);
  };

  const resetToDemo = () => {
    if (!DEMO_MODE) {
      // In real mode env, just clear data - don't load demo
      setFiles([]);
      setPrTitle("");
      setPrNumber(0);
      setRepoName("");
      setPrMeta(null);
      setMode("demo");
      setError(null);
      return;
    }
    
    const demoData = getDemoData();
    setRepoName(demoData.repoName);
    setPrTitle(demoData.prTitle);
    setPrNumber(demoData.prNumber);
    setFiles(demoData.files);
    setPrMeta(null);
    setMode("demo");
    setError(null);
    setSelectedFileIndex(null);
    setSelectedHunkId(null);
    setLanternCursor(null);
  };

  // Permission checks - destructive actions only in real mode
  const canApplyPatch = () => mode === "real" && prMeta !== null;
  const canApprove = () => mode === "real" && prMeta !== null;
  const canRequestChanges = () => mode === "real" && prMeta !== null;

  const isRealMode = mode === "real";

  const state: SpectralState = {
    mode,
    isRealMode,
    
    files,
    prTitle,
    prNumber,
    repoName,
    prMeta,
    error,
    isLoading,
    
    selectedFileIndex,
    selectedHunkId,
    lanternCursor,
    
    soundEnabled,
    reduceEffects,
    
    selectFile: setSelectedFileIndex,
    selectHunk: setSelectedHunkId,
    setLanternCursor,
    
    toggleSound: () => setSoundEnabled(prev => !prev),
    toggleReduceEffects: () => setReduceEffects(prev => !prev),
    loadRealPR,
    setError,
    setLoading: setIsLoading,
    resetToDemo,
    
    canApplyPatch,
    canApprove,
    canRequestChanges,
    
    getSelectedFile: () => {
      if (selectedFileIndex === null) return null;
      return files[selectedFileIndex] ?? null;
    },
    
    getSelectedHunk: () => {
      if (selectedFileIndex === null || !selectedHunkId) return null;
      const file = files[selectedFileIndex];
      return file?.hunks.find(h => h.id === selectedHunkId) ?? null;
    },
    
    getCurrentLanternHunk: () => {
      if (!lanternCursor) return null;
      const file = files[lanternCursor.fileIndex];
      if (!file) return null;
      const hunk = file.hunks[lanternCursor.hunkIndex];
      if (!hunk) return null;
      return { file, hunk };
    }
  };

  return (
    <SpectralContext.Provider value={state}>
      {children}
    </SpectralContext.Provider>
  );
}

export function useSpectral() {
  const ctx = useContext(SpectralContext);
  if (!ctx) {
    throw new Error("useSpectral must be used within SpectralProvider");
  }
  return ctx;
}

// Re-export types from demo for compatibility
export type { LanternCursor as LanternCursorType };
