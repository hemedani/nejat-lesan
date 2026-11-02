"use client";

import { useState } from "react";
import BackfillCityZonesModal from "./BackfillCityZonesModal";

interface BackfillCityZonesButtonProps {
  token?: string;
}

const BackfillCityZonesButton: React.FC<BackfillCityZonesButtonProps> = ({
  token,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-brand text-on-brand rounded-lg hover:bg-brand-hover transition-colors flex items-center gap-2"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        همگام‌سازی مناطق با تصادفات
      </button>

      <BackfillCityZonesModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        token={token}
      />
    </>
  );
};

export default BackfillCityZonesButton;
