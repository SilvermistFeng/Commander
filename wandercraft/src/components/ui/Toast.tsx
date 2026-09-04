"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { useIsClient } from "@/lib/useIsClient";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";
type Toast = { id: string; message: string; tone: ToastTone; detail?: string };

const ToastContext = createContext<{ push: (message: string, tone?: ToastTone, detail?: string) => void }>({
  push: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const isClient = useIsClient();

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (message: string, tone: ToastTone = "success", detail?: string) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t, { id, message, tone, detail }]);
      setTimeout(() => dismiss(id), 5000);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {isClient &&
        createPortal(
          <div className="pointer-events-none fixed bottom-5 left-1/2 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
            {toasts.map((t) => (
              <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const Icon = toast.tone === "success" ? CheckCircle2 : toast.tone === "error" ? AlertTriangle : Info;
  return (
    <div
      role="status"
      className={cn(
        "anim-fade-up pointer-events-auto flex items-start gap-3 rounded-xl border bg-surface px-4 py-3 shadow-float",
        toast.tone === "success" && "border-sage/30",
        toast.tone === "error" && "border-danger/35",
        toast.tone === "info" && "border-line"
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          toast.tone === "success" && "text-sage",
          toast.tone === "error" && "text-danger",
          toast.tone === "info" && "text-accent"
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">{toast.message}</p>
        {toast.detail ? <p className="mt-0.5 text-xs text-muted">{toast.detail}</p> : null}
      </div>
      <button onClick={onDismiss} aria-label="Dismiss" className="-mr-1 text-muted transition hover:text-ink">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
