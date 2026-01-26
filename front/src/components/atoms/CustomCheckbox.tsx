import React from "react";

interface CustomCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id?: string;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({ checked, onChange, label, id }) => {
  const handleChange = () => {
    onChange(!checked);
  };

  return (
    <div
      className={`flex items-center p-2 rounded-lg transition-colors duration-300 ${
        checked ? "bg-indigo-50" : "hover:bg-gray-50"
      }`}
    >
      <div
        className={`relative w-6 h-6 flex items-center justify-center rounded-lg border-2 cursor-pointer transition-all duration-300 ease-in-out transform ${
          checked
            ? "bg-gradient-to-br from-blue-500 to-indigo-600 border-transparent shadow-md"
            : "bg-white border-gray-300 hover:border-indigo-400 hover:shadow-sm"
        }`}
        onClick={handleChange}
      >
        {checked && (
          <svg
            className="w-4 h-4 text-white transition-transform duration-200 scale-100"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        )}

        {/* Animated checkmark background effect */}
        {checked && (
          <div className="absolute inset-0 rounded-lg bg-white opacity-20 animate-pulse"></div>
        )}

        {/* Hidden input for form accessibility */}
        <input type="checkbox" id={id} checked={checked} onChange={handleChange} className="sr-only" />
      </div>
      <label
        htmlFor={id}
        className={`mr-3 text-sm font-medium cursor-pointer transition-colors duration-200 ${
          checked ? "text-indigo-700" : "text-gray-700"
        }`}
      >
        {label}
      </label>
    </div>
  );
};

export default CustomCheckbox;
