import { type RefObject, useEffect, useRef } from "react";

/**
 * Attaches click-outside and Escape-key dismissal listeners while `active`
 * is true. Both ExportMenu and PdfExportDialog share this pattern; keeping it
 * in one place ensures they behave consistently.
 *
 * The `onClose` callback is stored in a ref so callers don't need to wrap it
 * in `useCallback` — the effect only re-runs when `active` or `ref` changes.
 */
export function useClickOutside(
  ref: RefObject<Element | null>,
  onClose: () => void,
  active: boolean,
): void {
  // Ref keeps `onClose` stable across renders without needing it as a dep.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!active) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        onCloseRef.current();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [ref, active]);
}
