import { useCallback, useState } from "react";

export type AdminToastTone = "success" | "error";
export type AdminToastState = { text: string; tone: AdminToastTone } | null;

/**
 * Shared feedback for admin forms: a small floating banner (rendered by
 * <AdminToast>) that always stays visible regardless of scroll position,
 * instead of a plain line of text that can end up off-screen or easy to
 * miss after saving.
 */
export function useAdminToast() {
  const [toast, setToast] = useState<AdminToastState>(null);

  const notifySuccess = useCallback(
    (text: string) => setToast({ text, tone: "success" }),
    [],
  );
  const notifyError = useCallback(
    (text: string) => setToast({ text, tone: "error" }),
    [],
  );
  const dismiss = useCallback(() => setToast(null), []);

  return { toast, notifySuccess, notifyError, dismiss };
}
