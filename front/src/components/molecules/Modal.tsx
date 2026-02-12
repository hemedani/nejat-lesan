"use client";
import React, { useEffect, useRef } from "react";
import { useScrollLock } from "@/hooks/useScrollLock";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      // Check if the click is on a date picker element
      const target = e.target as Node;
      const isDatePickerElement =
        target instanceof Element &&
        (target.classList.contains("not-close-modal") ||
          target.closest(".not-close-modal") !== null ||
          target.classList.contains("zm-DaysButton") ||
          target.classList.contains("zm-Header") ||
          target.classList.contains("zm-MonthYearButton") ||
          target.classList.contains("zm-IconPrevButton") ||
          target.classList.contains("zm-IconNextButton") ||
          target.classList.contains("zm-DaysButton") ||
          target.closest(".zm-Header") !== null ||
          target.closest(".zm-DaysButton") !== null ||
          target.closest(".zm-MonthYearButton") !== null ||
          target.closest(".css-1m8qzkt") !== null || // Main container
          target.closest(".css-817hxt") !== null || // Calendar wrapper
          target.closest(".zm-Wrap") !== null); // Wrapper element

      if (
        modalRef.current &&
        !modalRef.current.contains(e.target as Node) &&
        !isDatePickerElement &&
        isOpen
      ) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Prevent background scrolling when modal is open
  useScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 transform transition-all max-h-[90vh] overflow-hidden"
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;
