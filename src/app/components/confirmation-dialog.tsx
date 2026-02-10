import { useEffect, useId, useRef } from "react";

type ConfirmationDialogProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  restoreFocusTo?: HTMLButtonElement | null;
};

export function ConfirmationDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  restoreFocusTo,
}: ConfirmationDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [isOpen, onCancel]);

  useEffect(() => {
    if (isOpen) {
      confirmButtonRef.current?.focus();
      return;
    }

    restoreFocusTo?.focus();
  }, [isOpen, restoreFocusTo]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="dialog-overlay"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <section
        className="dialog-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <h3 id={titleId}>{title}</h3>
        <p id={descriptionId} className="muted">
          {description}
        </p>
        <p className="dialog-warning">이 작업은 되돌릴 수 없습니다.</p>
        <div className="dialog-actions">
          <button type="button" className="ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button ref={confirmButtonRef} type="button" className="danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
