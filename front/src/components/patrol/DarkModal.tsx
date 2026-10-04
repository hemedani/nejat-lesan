"use client";

import { useEffect } from "react";

import { useScrollLock } from "@/hooks/useScrollLock";

/**
 * The dark panels' dialog chrome.
 *
 * Extracted from `ReviewActions` rather than written a second time: the overlay, the
 * panel, the Escape key and the scroll lock were already the console's dialog, and a
 * bulk-action dialog that looked even slightly different would read as a different
 * product. The light `molecules/Modal` is the other dialog in this repo and is
 * deliberately not reused here — it is `bg-white` and belongs to the admin templates.
 *
 * Escape closes and nothing else does. A dialog that swallows its own confirm button
 * mid-write is the one behaviour a review console cannot have, so there is no
 * click-outside dismissal to guard against.
 */
export function DarkModal({
  isOpen,
  title,
  onClose,
  children,
  footer,
}: {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-[calc(100%-2rem)] max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
      >
        <h3 className="mb-4 text-lg font-bold text-white">{title}</h3>
        {children}
        {footer && <div className="mt-4 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
