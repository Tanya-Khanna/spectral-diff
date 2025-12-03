"use client";

import { ReactNode } from "react";
import { SpectralProvider } from "@/lib/store";
import { SoundProvider } from "./SoundProvider";
import { TopBar } from "./TopBar";
import { ToastProvider } from "./Toast";
import { ModeBanner } from "./ModeBanner";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SpectralProvider>
      <SoundProvider>
        <ToastProvider>
          <div className="min-h-screen bg-gray-950 text-gray-100">
            <ModeBanner />
            <TopBar />
            <main className="pt-32 pb-8 px-4">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </main>
            
            {/* Keyboard hints */}
            <div className="fixed bottom-4 right-4 text-xs text-gray-600 hidden lg:block">
              <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">n</kbd> next
              <span className="mx-2">·</span>
              <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">p</kbd> prev
              <span className="mx-2">·</span>
              <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">esc</kbd> back
            </div>
          </div>
        </ToastProvider>
      </SoundProvider>
    </SpectralProvider>
  );
}
