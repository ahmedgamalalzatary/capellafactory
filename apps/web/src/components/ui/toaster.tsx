"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type ToastType = "success" | "error";

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  toast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue>({ toast: () => { } });

export function useToast() {
  return useContext(ToastContext);
}

export function ToasterProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="fixed z-[100] flex flex-col gap-2 pointer-events-none"
        style={{ bottom: "1.5rem", insetInlineEnd: "1.5rem", minWidth: "280px" }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 px-4 py-3 text-[13px] font-medium pointer-events-auto"
            style={{
              background: t.type === "success" ? "#171717" : "#e7000b",
              color: "#ffffff",
              borderRadius: "var(--radius)",
              boxShadow: "var(--shadow-lg)",
              animation: "toast-in 0.22s ease-out",
            }}
          >
            <span className="text-[15px] leading-none shrink-0">
              {t.type === "success" ? "✓" : "✕"}
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
