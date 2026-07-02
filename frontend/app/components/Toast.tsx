"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// ── Typy ─────────────────────────────────────────────────────────────────────

type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

const AUTO_DISMISS_MS = 3500;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = `toast_${Date.now()}_${Math.random()}`;
      setToasts((prev) => [...prev.slice(-4), { id, message, variant }]);
      const timer = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastList toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ── UI ────────────────────────────────────────────────────────────────────────

const VARIANT_STYLES: Record<
  ToastVariant,
  { bg: string; color: string; border: string; icon: string }
> = {
  success: {
    bg: "rgba(163,228,215,0.95)",
    color: "#0F766E",
    border: "rgba(15,118,110,0.2)",
    icon: "✓",
  },
  error: {
    bg: "rgba(254,226,226,0.97)",
    color: "#B91C1C",
    border: "rgba(185,28,28,0.2)",
    icon: "✕",
  },
  info: {
    bg: "rgba(255,255,255,0.97)",
    color: "#4C1D95",
    border: "rgba(216,180,254,0.4)",
    icon: "✦",
  },
};

function ToastList({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const s = VARIANT_STYLES[toast.variant];

  return (
    <div
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        borderRadius: 14,
        padding: "10px 16px 10px 12px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 13,
        fontWeight: 600,
        fontFamily: '"Plus Jakarta Sans","Inter",sans-serif',
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        pointerEvents: "all",
        maxWidth: "min(400px, calc(100vw - 48px))",
        animation: "toast-in 0.2s ease",
        letterSpacing: "-0.01em",
      }}
    >
      <span style={{ fontSize: 14, flexShrink: 0, lineHeight: 1 }}>
        {s.icon}
      </span>
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 16,
          color: "inherit",
          opacity: 0.5,
          padding: 0,
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}

// Globalne @keyframes — wstrzykujemy jako style tag tylko raz
if (typeof document !== "undefined") {
  const styleId = "__nvc_toast_styles";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @keyframes toast-in {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }
}
