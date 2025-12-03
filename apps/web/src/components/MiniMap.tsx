"use client";

import { FileChange, LanternCursor } from "@/lib/types";

interface MiniMapProps {
  files: FileChange[];
  cursor: LanternCursor;
  onRoomClick: (fileIndex: number) => void;
}

export function MiniMap({ files, cursor, onRoomClick }: MiniMapProps) {
  return (
    <div className="flex items-center gap-1 p-2 bg-gray-900/80 rounded-xl backdrop-blur-sm">
      {files.map((file, fileIndex) => {
        const isCurrentRoom = fileIndex === cursor.fileIndex;
        const isPastRoom = fileIndex < cursor.fileIndex;
        
        // Calculate darkness based on risk
        const darkness = Math.min(file.risk / 100, 1);
        const bgLightness = Math.max(15, 35 - darkness * 25);
        
        return (
          <button
            key={file.path}
            onClick={() => onRoomClick(fileIndex)}
            className={`
              relative w-8 h-8 rounded-lg transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-purple-500
              ${isCurrentRoom ? "ring-2 ring-purple-400 scale-110 z-10" : ""}
              ${isPastRoom ? "opacity-50" : ""}
            `}
            style={{
              backgroundColor: `hsl(250, 15%, ${bgLightness}%)`,
            }}
            title={`${file.path} (Risk: ${file.risk})`}
            aria-label={`Room ${fileIndex + 1}: ${file.path}, risk ${file.risk}${isCurrentRoom ? ", current" : ""}`}
            aria-current={isCurrentRoom ? "step" : undefined}
          >
            {/* Hunk indicators */}
            <div className="absolute inset-1 flex flex-wrap gap-0.5 items-center justify-center">
              {file.hunks.map((hunk, hunkIndex) => {
                const isCurrentHunk = isCurrentRoom && hunkIndex === cursor.hunkIndex;
                const isPastHunk = isCurrentRoom && hunkIndex < cursor.hunkIndex;
                
                return (
                  <div
                    key={hunk.id}
                    className={`
                      w-1.5 h-1.5 rounded-full transition-all
                      ${isCurrentHunk 
                        ? "bg-purple-400 shadow-lg shadow-purple-400/50 scale-125" 
                        : isPastHunk 
                          ? "bg-gray-600" 
                          : "bg-gray-500/50"
                      }
                    `}
                  />
                );
              })}
            </div>
            
            {/* Room number */}
            <span className="absolute -bottom-1 -right-1 text-[10px] font-bold text-gray-500">
              {fileIndex + 1}
            </span>
          </button>
        );
      })}
    </div>
  );
}
