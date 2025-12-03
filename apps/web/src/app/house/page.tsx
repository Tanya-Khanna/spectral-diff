"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSpectral } from "@/lib/store";
import { useSound } from "@/components/SoundProvider";
import { RoomTile } from "@/components/RoomTile";
import { DiffMuralPanel } from "@/components/DiffMuralPanel";
import { FogLayer } from "@/components/FogLayer";
import { computeAllRisks, RoomRiskResult } from "@/lib/risk";

export default function HousePage() {
  const router = useRouter();
  const { files, selectedFileIndex, selectFile, selectHunk, setLanternCursor, reduceEffects } = useSpectral();
  const { play } = useSound();
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Compute risks for all files using the risk engine
  const filesWithRisk = useMemo(() => computeAllRisks({ files }), [files]);
  
  // Sort files by computed risk (highest first)
  const sortedFiles = useMemo(() => filesWithRisk.map(fr => fr.file), [filesWithRisk]);
  
  // Create a map for quick risk lookup
  const riskMap = useMemo(() => {
    const map = new Map<string, RoomRiskResult>();
    filesWithRisk.forEach(fr => map.set(fr.file.path, fr.risk));
    return map;
  }, [filesWithRisk]);
  
  const selectedFile = selectedFileIndex !== null ? files[selectedFileIndex] : null;
  const selectedFileRisk = selectedFile ? riskMap.get(selectedFile.path) : undefined;

  const startLanternFromDarkest = useCallback(() => {
    // Use risk-sorted files (first is highest risk)
    if (sortedFiles.length > 0) {
      const darkest = sortedFiles[0];
      const fileIndex = files.findIndex(f => f.path === darkest.path);
      setLanternCursor({ fileIndex, hunkIndex: 0 });
      play("match");
      router.push("/lantern");
    }
  }, [sortedFiles, files, setLanternCursor, play, router]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const cols = 3; // Grid columns
    const total = files.length;

    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, total - 1));
        break;
      case "ArrowLeft":
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + cols, total - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - cols, 0));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        const fileIndex = files.findIndex(f => f.path === sortedFiles[focusedIndex].path);
        selectFile(fileIndex);
        break;
      case "Escape":
        e.preventDefault();
        selectFile(null);
        break;
      case "l":
      case "L":
        e.preventDefault();
        startLanternFromDarkest();
        break;
    }
  }, [files, sortedFiles, focusedIndex, selectFile, startLanternFromDarkest]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleRoomClick = (sortedIndex: number) => {
    const file = sortedFiles[sortedIndex];
    const fileIndex = files.findIndex(f => f.path === file.path);
    selectFile(fileIndex);
    setFocusedIndex(sortedIndex);
  };

  const handleStartLanternFromFile = () => {
    if (selectedFileIndex !== null) {
      setLanternCursor({ fileIndex: selectedFileIndex, hunkIndex: 0 });
      play("match");
      router.push("/lantern");
    }
  };

  const handleSelectHunk = (hunkId: string) => {
    selectHunk(hunkId);
    if (selectedFileIndex !== null) {
      const hunkIndex = files[selectedFileIndex].hunks.findIndex(h => h.id === hunkId);
      setLanternCursor({ fileIndex: selectedFileIndex, hunkIndex });
      router.push("/exorcise");
    }
  };

  return (
    <div className="relative min-h-[80vh]">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 100% 60% at 50% 100%, rgba(30, 20, 50, 0.4) 0%, transparent 60%),
              radial-gradient(ellipse 40% 30% at 10% 20%, rgba(40, 30, 60, 0.3) 0%, transparent 50%),
              radial-gradient(ellipse 30% 20% at 90% 80%, rgba(50, 30, 70, 0.2) 0%, transparent 50%)
            `
          }}
        />
      </div>

      {/* Header */}
      <div className={`relative z-10 mb-8 ${!reduceEffects ? "animate-fade-in" : ""}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
              <span>🏰</span> Haunted House
            </h1>
            <p className="text-gray-500 mt-1">
              {files.length} rooms to explore · Click a room to inspect
            </p>
          </div>
          
          <button
            onClick={startLanternFromDarkest}
            className="
              px-6 py-3 rounded-xl font-medium
              bg-gradient-to-r from-amber-600 to-amber-700
              hover:from-amber-500 hover:to-amber-600
              text-white shadow-lg shadow-amber-900/30
              transition-all duration-200 hover:scale-105
              focus:outline-none focus:ring-2 focus:ring-amber-400
            "
          >
            🔦 Start Lantern Run
            <span className="ml-2 text-xs text-amber-200/70">(L)</span>
          </button>
        </div>
      </div>

      {/* Room Grid */}
      <div className="relative z-10">
        <div 
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          role="grid"
          aria-label="File rooms"
        >
          {sortedFiles.map((file, sortedIndex) => {
            const originalIndex = files.findIndex(f => f.path === file.path);
            const fileRisk = riskMap.get(file.path);
            return (
              <div
                key={file.path}
                role="gridcell"
                tabIndex={sortedIndex === focusedIndex ? 0 : -1}
                className={sortedIndex === focusedIndex ? "ring-2 ring-purple-500 rounded-2xl" : ""}
              >
                <RoomTile
                  file={file}
                  onClick={() => handleRoomClick(sortedIndex)}
                  isSelected={selectedFileIndex === originalIndex}
                  riskResult={fileRisk}
                />
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-8 flex flex-wrap items-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-emerald-400 rounded shadow-emerald-400/50 shadow-sm" />
            <span>Added lines</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-gray-500 rounded" />
            <span>Removed lines</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-amber-400 rounded shadow-amber-400/50 shadow-sm" />
            <span>Modified lines</span>
          </div>
          <div className="flex items-center gap-2">
            <span>💀</span>
            <span>Critical (workflow/CI)</span>
          </div>
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>Warning (50-80)</span>
          </div>
          <div className="flex items-center gap-2">
            <span>⚡</span>
            <span>Risk signals</span>
          </div>
        </div>
      </div>

      {/* Ambient fog */}
      {!reduceEffects && (
        <div className="fixed bottom-0 left-0 right-0 h-32 pointer-events-none">
          <FogLayer intensity={40} />
        </div>
      )}

      {/* Diff Mural Panel */}
      {selectedFile && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => selectFile(null)}
            aria-hidden="true"
          />
          <div className="z-50">
            <DiffMuralPanel
              file={selectedFile}
              onClose={() => selectFile(null)}
              onStartLantern={handleStartLanternFromFile}
              onSelectHunk={handleSelectHunk}
              riskResult={selectedFileRisk}
            />
          </div>
        </>
      )}
    </div>
  );
}
