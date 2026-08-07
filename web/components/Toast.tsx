"use client";
import { createContext, useCallback, useContext, useState } from "react";

type Kind = "success" | "error" | "info";
type Toast = { id: number; kind: Kind; msg: string };

const Ctx = createContext<((kind: Kind, msg: string) => void) | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((kind: Kind, msg: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="fixed inset-x-0 bottom-6 z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="card px-4 py-3 max-w-sm w-full text-sm font-medium flex items-center gap-3 pointer-events-auto"
            style={{
              borderColor:
                t.kind === "success"
                  ? "var(--mint)"
                  : t.kind === "error"
                    ? "var(--coral)"
                    : "var(--ink-12)",
            }}
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{
                background:
                  t.kind === "success"
                    ? "var(--mint)"
                    : t.kind === "error"
                      ? "var(--coral)"
                      : "var(--volt)",
              }}
            />
            {t.msg}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useToast outside ToastProvider");
  return c;
}
