"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";

interface SearchBoxProps {
  defaultValue?: string;
  title: string;
}

const SearchBox: React.FC<SearchBoxProps> = ({ defaultValue = "", title }) => {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();

  const clickHandler = () => {
    setQuery("");
    router.refresh();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`?${title}=${encodeURIComponent(query)}`);
  };

  return (
    <>
      {title === "search" && (
        <button
          onClick={() => router.push("/admin/articles/createArticle")}
          className="px-6 h-10 bg-gradient-to-r from-blue-500 to-blue-700 text-on-brand text-sm font-semibold rounded-md shadow hover:from-blue-600 hover:to-blue-800 transition-all duration-300"
        >
          ایجاد مقاله جدید
        </button>
      )}
      <form onSubmit={handleSearch} className="mt-4 flex gap-2">
        <input
          type="text"
          placeholder="جستجو کنید..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border border-line bg-surface p-2.5 rounded-xl flex-1 text-fg placeholder:text-fg-faint outline-none focus:border-blue-400/50"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-brand text-on-brand rounded-xl hover:bg-brand-hover"
        >
          جستجو
        </button>
        <button
          onClick={clickHandler}
          className="px-4 py-2 bg-surface-sunken border border-line text-fg-muted rounded-xl hover:bg-surface-hover"
        >
          خالی شدن
        </button>
      </form>
    </>
  );
};

export default SearchBox;
