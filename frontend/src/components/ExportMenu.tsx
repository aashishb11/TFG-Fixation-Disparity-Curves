import { useEffect, useId, useRef, useState } from "react";

type ExportMenuProps = {
  onDownloadPdf: () => void;
  onDownloadPng: () => void;
};

export function ExportMenu({
  onDownloadPdf,
  onDownloadPng,
}: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  return (
    <div ref={menuRef} className="export-menu">
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="button button--secondary chart-card__action export-menu__trigger"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        Export
      </button>

      {isOpen ? (
        <div id={menuId} className="export-menu__panel" role="menu">
          <button
            className="export-menu__item"
            onClick={() => handleAction(onDownloadPng)}
            role="menuitem"
            type="button"
          >
            Download as PNG
          </button>
          <button
            className="export-menu__item"
            onClick={() => handleAction(onDownloadPdf)}
            role="menuitem"
            type="button"
          >
            Download as PDF
          </button>
        </div>
      ) : null}
    </div>
  );
}
