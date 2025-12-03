"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useSpectral } from "@/lib/store";
import { ExorcisePanel } from "@/components/ExorcisePanel";
import { FogLayer } from "@/components/FogLayer";

export default function ExorcisePage() {
  const router = useRouter();
  const { 
    files, 
    lanternCursor, 
    selectedHunkId,
    reduceEffects 
  } = useSpectral();
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" } | null>(null);

  // Get current file and hunk
  const currentFile = lanternCursor ? files[lanternCursor.fileIndex] : null;
  const currentHunk = currentFile 
    ? (selectedHunkId 
        ? currentFile.hunks.find(h => h.id === selectedHunkId) 
        : currentFile.hunks[lanternCursor!.hunkIndex])
    : null;

  const showToast = useCallback((message: string, type: "success" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handlePostComment = useCallback(() => {
    showToast("💬 Comment posted to the void...", "success");
  }, [showToast]);

  const handleRequestChanges = useCallback(() => {
    showToast("✋ Changes requested from the spirits...", "success");
  }, [showToast]);

  const handleBack = useCallback(() => {
    router.push("/lantern");
  }, [router]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleBack]);

  // Redirect if no hunk selected
  useEffect(() => {
    if (!currentFile || !currentHunk) {
      router.push("/house");
    }
  }, [currentFile, currentHunk, router]);

  if (!currentFile || !currentHunk) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl mb-4 block">⚗️</span>
          <p className="text-gray-400">Preparing the chamber...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[80vh]">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 50% 100%, rgba(88, 28, 135, 0.2) 0%, transparent 50%),
              radial-gradient(ellipse 50% 40% at 20% 30%, rgba(30, 20, 50, 0.3) 0%, transparent 50%)
            `
          }}
        />
        {!reduceEffects && <FogLayer intensity={40} />}
      </div>

      {/* Header */}
      <div className={`relative z-10 mb-6 ${!reduceEffects ? "animate-fade-in" : ""}`}>
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label="Back to lantern mode (Escape)"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
              <span>⚗️</span> Exorcise Chamber
            </h1>
            <p className="text-sm text-gray-500">
              Banish the demons from this code
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-3xl mx-auto">
        <ExorcisePanel
          file={currentFile}
          hunk={currentHunk}
          onPostComment={handlePostComment}
          onRequestChanges={handleRequestChanges}
          onBack={handleBack}
        />
      </div>

      {/* Toast */}
      {toast && (
        <div 
          className={`
            fixed bottom-8 left-1/2 -translate-x-1/2 z-50
            px-6 py-3 rounded-xl backdrop-blur-sm
            ${toast.type === "success" 
              ? "bg-emerald-900/90 border border-emerald-700 text-emerald-200" 
              : "bg-purple-900/90 border border-purple-700 text-purple-200"
            }
            ${!reduceEffects ? "animate-slide-up" : ""}
          `}
          role="alert"
        >
          {toast.message}
        </div>
      )}

      {/* Keyboard hint */}
      <div className="fixed bottom-8 right-8 z-10">
        <div className="px-3 py-2 bg-gray-900/80 backdrop-blur-sm rounded-xl text-xs text-gray-500">
          <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">Esc</kbd> Back to Lantern
        </div>
      </div>
    </div>
  );
}
