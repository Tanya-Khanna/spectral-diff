"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface ToastData {
  id: number;
  message: string;
  type: "success" | "info" | "warning";
}

interface ToastContextType {
  show: (message: string, type?: ToastData["type"]) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const show = useCallback((message: string, type: ToastData["type"] = "info") => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts }: { toasts: ToastData[] }) {
  if (toasts.length === 0) return null;

  const typeStyles = {
    success: "bg-emerald-900/90 border-emerald-700 text-emerald-200",
    info: "bg-purple-900/90 border-purple-700 text-purple-200",
    warning: "bg-amber-900/90 border-amber-700 text-amber-200",
  };

  const icons = {
    success: "✓",
    info: "👻",
    warning: "⚠️",
  };

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`
            px-4 py-3 rounded-xl border backdrop-blur-sm
            shadow-lg animate-slide-up
            ${typeStyles[toast.type]}
          `}
          role="alert"
        >
          <span className="mr-2">{icons[toast.type]}</span>
          {toast.message}
        </div>
      ))}
    </div>
  );
}

export function Toast() {
  return null; // Placeholder for the actual toast container
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Return a no-op if not in provider (for safety)
    return { show: () => {} };
  }
  return ctx;
}
