import { useId, useRef, useState } from "react";
import { useClickOutside } from "../hooks/useClickOutside";

type ExportMenuProps = {
  onDownloadPdf: () => void;
  onDownloadPng: () => void;
};

export function ExportMenu({ onDownloadPdf, onDownloadPng }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close on click-outside or Escape while the panel is open.
  useClickOutside(menuRef, () => setIsOpen(false), isOpen);

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
