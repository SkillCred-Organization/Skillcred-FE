import { useCallback, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import Toast from "./Toast";
import { ToastContext } from "./toastContext";
import type { ToastApi, ToastKind, ToastOptions } from "./toastContext";

type ToastItem = ToastOptions & {
  id: number;
  kind: ToastKind;
  message: string;
};

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (kind: ToastKind, message: string, options: ToastOptions = {}) => {
      const id = nextId.current++;
      setToasts((list) => [...list, { id, kind, message, ...options }]);
      setTimeout(() => dismiss(id), kind === "success" ? 6000 : 8000);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (message, options) => show("success", message, options),
      error: (message, options) => show("error", message, options),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            kind={t.kind}
            message={t.message}
            actionLabel={t.actionLabel}
            onAction={t.onAction}
            onClose={() => dismiss(t.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
