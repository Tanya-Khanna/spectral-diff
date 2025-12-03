"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSpectral } from "@/lib/store";

export function TopBar() {
  const pathname = usePathname();
  const { 
    prTitle, 
    prNumber, 
    repoName,
    soundEnabled, 
    reduceEffects, 
    toggleSound, 
    toggleReduceEffects 
  } = useSpectral();

  const navItems = [
    { href: "/", label: "Lobby", icon: "🏚️" },
    { href: "/house", label: "House", icon: "🏰" },
    { href: "/lantern", label: "Lantern", icon: "🔦" },
    { href: "/exorcise", label: "Exorcise", icon: "⚗️" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950/90 backdrop-blur-md border-b border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo & PR Info */}
        <div className="flex items-center gap-4">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
          >
            <span className="text-2xl">👻</span>
            <span className="font-semibold tracking-tight hidden sm:inline">Spectral Diff</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-400">
            <span className="text-gray-600">|</span>
            <span className="text-gray-500">{repoName}</span>
            <span className="text-purple-500">#{prNumber}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-950
                ${pathname === item.href 
                  ? "bg-purple-900/50 text-purple-300 shadow-lg shadow-purple-900/20" 
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                }
              `}
            >
              <span className="mr-1.5">{item.icon}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleReduceEffects}
            className={`
              p-2 rounded-lg text-sm transition-all
              focus:outline-none focus:ring-2 focus:ring-purple-500
              ${reduceEffects 
                ? "bg-amber-900/30 text-amber-400" 
                : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50"
              }
            `}
            title={reduceEffects ? "Effects reduced" : "Reduce effects"}
            aria-label={reduceEffects ? "Effects reduced" : "Reduce effects"}
          >
            {reduceEffects ? "🌙" : "✨"}
          </button>
          
          <button
            onClick={toggleSound}
            className={`
              p-2 rounded-lg text-sm transition-all
              focus:outline-none focus:ring-2 focus:ring-purple-500
              ${soundEnabled 
                ? "bg-purple-900/30 text-purple-400" 
                : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50"
              }
            `}
            title={soundEnabled ? "Sound on" : "Sound off"}
            aria-label={soundEnabled ? "Sound on" : "Sound off"}
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>
        </div>
      </div>
      
      {/* PR Title Bar */}
      <div className="bg-gray-900/50 border-t border-gray-800/30 px-4 py-2">
        <p className="max-w-7xl mx-auto text-sm text-gray-300 truncate">
          {prTitle}
        </p>
      </div>
    </header>
  );
}
