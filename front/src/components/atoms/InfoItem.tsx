import React from "react";

interface InfoItemProps {
  label: string;
  value: string;
  onClick?: () => void;
}

/**
 * InfoItem component that displays a label and value pair with optional click behavior
 */
export const InfoItem = ({ label, value, onClick }: InfoItemProps) => (
  <div className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-0 last:pb-0">
    <span className="text-gray-500">{label}:</span>
    <span
      className="text-gray-800 hover:text-indigo-600 transition-colors duration-300 cursor-pointer font-medium"
      onClick={onClick}
    >
      {value}
    </span>
  </div>
);

export default InfoItem;
