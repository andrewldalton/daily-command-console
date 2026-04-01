import { useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface XPToastOptions {
  xp: number;
  label?: string;
  color?: string;
  multiplier?: number;
}

interface Toast extends XPToastOptions {
  id: number;
}

// ---------------------------------------------------------------------------
// Module-level toast store
// ---------------------------------------------------------------------------

const MAX_VISIBLE = 3;
const AUTO_DISMISS_MS = 2_000;

let toasts: Toast[] = [];
let nextId = 0;
let listeners: Set<() => void> = new Set();

function emitChange() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Toast[] {
  return toasts;
}

function removeToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emitChange();
}

// ---------------------------------------------------------------------------
// Public imperative API
// ---------------------------------------------------------------------------

export function showXPToast(options: XPToastOptions): void {
  const id = nextId++;
  const toast: Toast = { ...options, id };

  toasts = [...toasts, toast];

  // Enforce max-visible limit by removing oldest
  while (toasts.length > MAX_VISIBLE) {
    toasts = toasts.slice(1);
  }

  emitChange();

  // Auto-dismiss after 2 seconds
  setTimeout(() => removeToast(id), AUTO_DISMISS_MS);
}

// ---------------------------------------------------------------------------
// Container component
// ---------------------------------------------------------------------------

export function XPToastContainer() {
  const activeToasts = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "6rem",
        right: "1.5rem",
        zIndex: 250,
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        pointerEvents: "none",
      }}
    >
      <AnimatePresence mode="popLayout">
        {activeToasts.map((toast) => (
          <XPToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Individual toast item
// ---------------------------------------------------------------------------

function XPToastItem({ toast }: { toast: Toast }) {
  const accentColor = toast.color ?? "#38bdf8";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ type: "spring", duration: 0.3 }}
      style={{
        background: "#1e2433",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "0.5rem",
        padding: "0.625rem 1rem",
        pointerEvents: "auto",
        minWidth: "10rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span
          style={{
            color: accentColor,
            fontFamily: "ui-monospace, monospace",
            fontWeight: 700,
            fontSize: "1rem",
          }}
        >
          +{toast.xp} XP
        </span>

        {toast.multiplier != null && toast.multiplier > 1 && (
          <span
            style={{
              color: "#fbbf24",
              fontFamily: "ui-monospace, monospace",
              fontWeight: 700,
              fontSize: "0.875rem",
            }}
          >
            &times; {toast.multiplier}
          </span>
        )}
      </div>

      {toast.label && (
        <div
          style={{
            color: "rgba(255, 255, 255, 0.55)",
            fontSize: "0.75rem",
            marginTop: "0.125rem",
            lineHeight: 1.3,
          }}
        >
          {toast.label}
        </div>
      )}
    </motion.div>
  );
}

export default XPToastContainer;
