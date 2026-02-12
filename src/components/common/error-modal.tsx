"use client";

type ErrorModalProps = {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
};

export function ErrorModal({ open, title, message, onClose }: ErrorModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="dialog-overlay" role="presentation" onClick={onClose}>
      <section className="dialog-card" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p className="muted">{message}</p>
        <div className="dialog-actions">
          <button type="button" onClick={onClose}>
            확인
          </button>
        </div>
      </section>
    </div>
  );
}
