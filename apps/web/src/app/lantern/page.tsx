"use client";

import { useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSpectral } from "@/lib/store";
import { useSound } from "@/components/SoundProvider";
import { LanternOverlay } from "@/components/LanternOverlay";
import { MiniMap } from "@/components/MiniMap";
import { FogLayer } from "@/components/FogLayer";
import { 
  getTotalHunks, 
  LanternCursor 
} from "@/lib/types";
import { computeAllRisks, RoomRiskResult } from "@/lib/risk";

export default function LanternPage() {
  const router = useRouter();
  const { 
    files, 
    lanternCursor, 
    setLanternCursor, 
    selectHunk,
    reduceEffects 
  } = useSpectral();
  const { play } = useSound();

  // Compute risks and sort by computed risk (highest first)
  const filesWithRisk = useMemo(() => computeAllRisks({ files }), [files]);
  const sortedFiles = useMemo(() => filesWithRisk.map(fr => fr.file), [filesWithRisk]);
  
  // Create risk lookup map
  const riskMap = useMemo(() => {
    const map = new Map<string, RoomRiskResult>();
    filesWithRisk.forEach(fr => map.set(fr.file.path, fr.risk));
    return map;
  }, [filesWithRisk]);
  
  const totalHunks = getTotalHunks(files);

  // Initialize cursor if not set
  useEffect(() => {
    if (!lanternCursor && files.length > 0) {
      // Start from the highest risk file
      const highestRiskFile = sortedFiles[0];
      const fileIndex = files.findIndex(f => f.path === highestRiskFile.path);
      setLanternCursor({ fileIndex, hunkIndex: 0 });
      play("match");
    }
  }, [lanternCursor, files, sortedFiles, setLanternCursor, play]);

  const currentFile = lanternCursor ? files[lanternCursor.fileIndex] : null;
  const currentHunk = currentFile ? currentFile.hunks[lanternCursor!.hunkIndex] : null;
  const currentFileRisk = currentFile ? riskMap.get(currentFile.path) : undefined;
  
  // Calculate current hunk number based on risk-sorted order
  const currentHunkNum = useMemo(() => {
    if (!lanternCursor || !currentFile) return 0;
    let count = 0;
    for (const file of sortedFiles) {
      for (let hi = 0; hi < file.hunks.length; hi++) {
        count++;
        if (file.path === currentFile.path && hi === lanternCursor.hunkIndex) {
          return count;
        }
      }
    }
    return count;
  }, [lanternCursor, currentFile, sortedFiles]);
  
  // Current room number in risk-sorted order
  const currentRoomNum = currentFile 
    ? sortedFiles.findIndex(f => f.path === currentFile.path) + 1 
    : 0;

  // Calculate next/prev availability
  const getNextCursor = useCallback((): LanternCursor | null => {
    if (!lanternCursor) return null;
    
    const currentFile = files[lanternCursor.fileIndex];
    
    // Try next hunk in current file
    if (lanternCursor.hunkIndex < currentFile.hunks.length - 1) {
      return { fileIndex: lanternCursor.fileIndex, hunkIndex: lanternCursor.hunkIndex + 1 };
    }
    
    // Try first hunk of next file (by risk order)
    const currentSortedIndex = sortedFiles.findIndex(f => f.path === currentFile.path);
    if (currentSortedIndex < sortedFiles.length - 1) {
      const nextFile = sortedFiles[currentSortedIndex + 1];
      const nextFileIndex = files.findIndex(f => f.path === nextFile.path);
      return { fileIndex: nextFileIndex, hunkIndex: 0 };
    }
    
    return null;
  }, [lanternCursor, files, sortedFiles]);

  const getPrevCursor = useCallback((): LanternCursor | null => {
    if (!lanternCursor) return null;
    
    // Try prev hunk in current file
    if (lanternCursor.hunkIndex > 0) {
      return { fileIndex: lanternCursor.fileIndex, hunkIndex: lanternCursor.hunkIndex - 1 };
    }
    
    // Try last hunk of prev file (by risk order)
    const currentFile = files[lanternCursor.fileIndex];
    const currentSortedIndex = sortedFiles.findIndex(f => f.path === currentFile.path);
    if (currentSortedIndex > 0) {
      const prevFile = sortedFiles[currentSortedIndex - 1];
      const prevFileIndex = files.findIndex(f => f.path === prevFile.path);
      return { fileIndex: prevFileIndex, hunkIndex: files[prevFileIndex].hunks.length - 1 };
    }
    
    return null;
  }, [lanternCursor, files, sortedFiles]);

  const hasNext = getNextCursor() !== null;
  const hasPrev = getPrevCursor() !== null;

  const goNext = useCallback(() => {
    const next = getNextCursor();
    if (next) {
      setLanternCursor(next);
      play("whoosh");
    }
  }, [getNextCursor, setLanternCursor, play]);

  const goPrev = useCallback(() => {
    const prev = getPrevCursor();
    if (prev) {
      setLanternCursor(prev);
      play("whoosh");
    }
  }, [getPrevCursor, setLanternCursor, play]);

  const goToExorcise = useCallback(() => {
    if (currentHunk) {
      selectHunk(currentHunk.id);
      router.push("/exorcise");
    }
  }, [currentHunk, selectHunk, router]);

  const goToHouse = useCallback(() => {
    router.push("/house");
  }, [router]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case "n":
          e.preventDefault();
          goNext();
          break;
        case "p":
          e.preventDefault();
          goPrev();
          break;
        case "c":
          e.preventDefault();
          goToExorcise();
          break;
        case "escape":
          e.preventDefault();
          goToHouse();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev, goToExorcise, goToHouse]);

  const handleRoomClick = (fileIndex: number) => {
    setLanternCursor({ fileIndex, hunkIndex: 0 });
    play("whoosh");
  };

  if (!lanternCursor || !currentFile || !currentHunk) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl mb-4 block animate-pulse">🔦</span>
          <p className="text-gray-400">Lighting the lantern...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[80vh]">
      {/* Fog background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gray-950" />
        {!reduceEffects && <FogLayer intensity={60} />}
        
        {/* Lantern glow effect */}
        {!reduceEffects && (
          <div 
            className="absolute inset-0 animate-lantern-flicker"
            style={{
              background: `
                radial-gradient(
                  ellipse 60% 50% at 50% 40%,
                  rgba(251, 191, 36, 0.06) 0%,
                  transparent 60%
                )
              `
            }}
          />
        )}
      </div>

      {/* Header with MiniMap */}
      <div className={`relative z-10 mb-6 ${!reduceEffects ? "animate-fade-in" : ""}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={goToHouse}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
              aria-label="Back to house (Escape)"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
                <span className={!reduceEffects ? "animate-lantern-flicker" : ""}>🔦</span> 
                Lantern Mode
              </h1>
              <p className="text-sm text-gray-500">
                Focus on one hunk at a time
              </p>
            </div>
          </div>
          
          <MiniMap 
            files={sortedFiles.map(sf => files.find(f => f.path === sf.path)!)}
            cursor={{
              fileIndex: sortedFiles.findIndex(f => f.path === currentFile.path),
              hunkIndex: lanternCursor.hunkIndex
            }}
            onRoomClick={(sortedIndex) => {
              const file = sortedFiles[sortedIndex];
              const fileIndex = files.findIndex(f => f.path === file.path);
              handleRoomClick(fileIndex);
            }}
          />
        </div>
      </div>

      {/* Main lantern content */}
      <div className="relative z-10 max-w-4xl mx-auto">
        <LanternOverlay
          file={currentFile}
          hunk={currentHunk}
          currentHunkNum={currentHunkNum}
          totalHunks={totalHunks}
          currentRoomNum={currentRoomNum}
          totalRooms={files.length}
          onNext={goNext}
          onPrev={goPrev}
          onExorcise={goToExorcise}
          hasNext={hasNext}
          hasPrev={hasPrev}
          riskResult={currentFileRisk}
        />
      </div>

      {/* Keyboard hints */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-10">
        <div className="flex items-center gap-4 px-4 py-2 bg-gray-900/80 backdrop-blur-sm rounded-xl text-xs text-gray-500">
          <span><kbd className="px-1.5 py-0.5 bg-gray-800 rounded">N</kbd> Next</span>
          <span><kbd className="px-1.5 py-0.5 bg-gray-800 rounded">P</kbd> Prev</span>
          <span><kbd className="px-1.5 py-0.5 bg-gray-800 rounded">C</kbd> Exorcise</span>
          <span><kbd className="px-1.5 py-0.5 bg-gray-800 rounded">Esc</kbd> Exit</span>
        </div>
      </div>
    </div>
  );
}
