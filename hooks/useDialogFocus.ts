import { useCallback, useEffect, useRef } from "react";

const FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useDialogFocus<T extends HTMLElement>(
  open: boolean,
  onClose: () => void,
) {
  const dialogRef = useRef<T>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const captureTrigger = useCallback(() => {
    triggerRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  }, []);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const previousFocus = triggerRef.current;
    const focusTimer = window.setTimeout(() => {
      const closeButton = dialog?.querySelector<HTMLElement>('[aria-label="Cerrar detalle"]');
      (closeButton ?? dialog)?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.getClientRects().length > 0,
      );
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [onClose, open]);

  return { dialogRef, captureTrigger };
}
