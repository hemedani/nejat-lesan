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
          className="px-6 h-10 bg-gradient-to-r from-blue-500 to-blue-700 text-white text-sm font-semibold rounded-md shadow hover:from-blue-600 hover:to-blue-800 transition-all duration-300"
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
          className="border border-white/10 bg-slate-900 p-2.5 rounded-xl flex-1 text-slate-200 placeholder:text-slate-500 outline-none focus:border-blue-400/50"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500"
        >
          جستجو
        </button>
        <button
          onClick={clickHandler}
          className="px-4 py-2 bg-slate-800 border border-white/10 text-slate-300 rounded-xl hover:bg-slate-700"
        >
          خالی شدن
        </button>
      </form>
    </>
  );
};

export default SearchBox;
