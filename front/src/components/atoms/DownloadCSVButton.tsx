"use client";

import React from "react";

interface CSVData {
  [key: string]: string | number | undefined | null;
}

interface DownloadCSVButtonProps {
  data: CSVData[];
  filename: string;
  headers?: string[];
  buttonText?: string;
}

const DownloadCSVButton: React.FC<DownloadCSVButtonProps> = ({
  data,
  filename,
  headers,
  buttonText = "دانلود CSV",
}) => {
  const downloadCSV = () => {
    if (!data || data.length === 0) return;

    const keys = headers || Object.keys(data[0]);

    const csvContent = [
      keys.join(","),
      ...data.map((row) =>
        keys
          .map((key) => {
            const value = row[key];
            if (value === null || value === undefined) return "";
            const str = String(value);
            if (str.includes(",") || str.includes('"') || str.includes("\n")) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(","),
      ),
    ].join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <button
      onClick={downloadCSV}
      disabled={!data || data.length === 0}
      className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      {buttonText}
    </button>
  );
};

export default DownloadCSVButton;
