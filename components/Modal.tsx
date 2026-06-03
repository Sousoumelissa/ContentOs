"use client";

import { useCallback, useEffect, useRef } from "react";
import { X } from "lucide-react";

export function Modal({
  title,
  children,
  onClose,
  shouldConfirmClose = false,
  confirmCloseMessage = "Des modifications ne sont pas sauvegardees. Fermer quand meme ?"
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  shouldConfirmClose?: boolean;
  confirmCloseMessage?: string;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const requestClose = useCallback(() => {
    if (shouldConfirmClose && !window.confirm(confirmCloseMessage)) return;
    onClose();
  }, [confirmCloseMessage, onClose, shouldConfirmClose]);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") requestClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [requestClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-end bg-zinc-950/35 p-3 backdrop-blur-sm sm:items-center sm:justify-center"
      onClick={requestClose}
    >
      <div
        className="max-h-[90vh] w-full overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:max-w-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="min-w-0 text-xl font-black text-zinc-950">{title}</h3>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={requestClose}
            aria-label="Fermer la popup"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
