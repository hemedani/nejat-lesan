"use client";
import { useState } from "react";
import AdvancedSearch from "../molecules/AdvancedSearch";
import { DefaultSearchArrayValues } from "@/utils/prepareAccidentSearch";

const ToggleAdvancedSearch = ({ defaultSearchArrayValues, pageAddress }: {
  defaultSearchArrayValues: DefaultSearchArrayValues,
  pageAddress?: string
}) => {
  const [showAdvancedSearch, setShowAdvancedSearch] = useState<boolean>(false);

  const toggleAdvancedSearch = () => {
    setShowAdvancedSearch(!showAdvancedSearch);
  };

  return (
    <div className="text-center">
      <button
        type="button"
        onClick={toggleAdvancedSearch}
        className={`px-4 py-2 rounded-3xl w-full md:w-auto transition-all ${showAdvancedSearch
          ? "bg-brand text-on-brand hover:bg-brand-hover"
          : "bg-surface-hover text-fg hover:bg-line-strong"
          }`}
      >
        {showAdvancedSearch ? "بستن جستجوی پیشرفته" : "باز کردن جستجوی پیشرفته"}
      </button>
      <div
        className={`w-full mx-auto mt-6 overflow-hidden transition-all duration-500 ${showAdvancedSearch ? "max-h-auto opacity-100" : "max-h-0 opacity-0"
          }`}
      >
        <AdvancedSearch isOpen={showAdvancedSearch} defaultSearchArrayValues={defaultSearchArrayValues} pageAddress={pageAddress} />
      </div>
    </div>
  );
};

export default ToggleAdvancedSearch;
