import { useEffect } from "react";
import type { AdminToastState } from "../../hooks/useAdminToast";

type AdminToastProps = {
  toast: AdminToastState;
  onDismiss: () => void;
};

/**
 * A fixed-position confirmation/error banner for admin pages. Unlike a
 * plain line of text inside a form, this stays visible no matter where
 * the page is scrolled, so saving something far down a long page (or
 * editing an item from a long list) still gives clear, visible feedback.
 */
function AdminToast({ toast, onDismiss }: AdminToastProps) {
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(onDismiss, 4500);
    return () => clearTimeout(timeout);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed left-1/2 top-5 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 border px-5 py-4 text-sm shadow-lg sm:left-auto sm:right-6 sm:w-auto sm:translate-x-0 ${
        toast.tone === "error"
          ? "border-red-800/30 bg-red-50 text-red-800"
          : "border-emerald-800/30 bg-emerald-50 text-emerald-900"
      }`}
    >
      {toast.text}
    </div>
  );
}

export default AdminToast;
