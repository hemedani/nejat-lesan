"use client";

import { useState } from "react";
import Link from "next/link";

type FilterValue = string | string[] | number;

interface FilterInfo {
  key: string;
  value: FilterValue;
  label: string;
  displayValue?: string;
}

interface FilterDescriptionProps {
  activeFilters: FilterInfo[];
}

export const FilterDescription = ({
  activeFilters,
}: FilterDescriptionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter category icons with colored backgrounds
  const filterIcons = {
    search: (
      <div className="p-2 bg-blue-50 rounded-lg">
        <svg
          className="w-5 h-5 text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
    ),
    author: (
      <div className="p-2 bg-green-50 rounded-lg">
        <svg
          className="w-5 h-5 text-green-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </div>
    ),
    tag: (
      <div className="p-2 bg-purple-50 rounded-lg">
        <svg
          className="w-5 h-5 text-purple-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
          />
        </svg>
      </div>
    ),
    keyword: (
      <div className="p-2 bg-purple-50 rounded-lg">
        <svg
          className="w-5 h-5 text-purple-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
          />
        </svg>
      </div>
    ),
    publication: (
      <div className="p-2 bg-amber-50 rounded-lg">
        <svg
          className="w-5 h-5 text-amber-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      </div>
    ),
    year: (
      <div className="p-2 bg-cyan-50 rounded-lg">
        <svg
          className="w-5 h-5 text-cyan-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    ),
    type: (
      <div className="p-2 bg-indigo-50 rounded-lg">
        <svg
          className="w-5 h-5 text-indigo-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
    ),
    default: (
      <div className="p-2 bg-gray-50 rounded-lg">
        <svg
          className="w-5 h-5 text-gray-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
      </div>
    ),
  };

  // Map filter keys to icon categories
  const getIconForFilter = (key: string) => {
    const iconMapping: Record<string, keyof typeof filterIcons> = {
      search: "search",
      authorIds: "author",
      tagIds: "tag",
      keywordIds: "keyword",
      publication: "publication",
      year: "year",
      articleType: "type",
      DOI: "default",
      ISBN: "default",
    };

    const iconKey = iconMapping[key] || "default";
    return filterIcons[iconKey];
  };

  // Get appropriate background color class based on filter type
  const getFilterBgClass = (key: string): string => {
    const bgMapping: Record<string, string> = {
      search: "bg-blue-50 text-blue-700 border-blue-100",
      authorIds: "bg-green-50 text-green-700 border-green-100",
      tagIds: "bg-purple-50 text-purple-700 border-purple-100",
      keywordIds: "bg-purple-50 text-purple-700 border-purple-100",
      publication: "bg-amber-50 text-amber-700 border-amber-100",
      year: "bg-cyan-50 text-cyan-700 border-cyan-100",
      articleType: "bg-indigo-50 text-indigo-700 border-indigo-100",
      DOI: "bg-gray-50 text-gray-700 border-gray-100",
      ISBN: "bg-gray-50 text-gray-700 border-gray-100",
    };

    return bgMapping[key] || "bg-gray-50 text-gray-700 border-gray-100";
  };

  // Format the displayed filter value
  const formatFilterValue = (filter: FilterInfo): string => {
    if (filter.displayValue) return filter.displayValue;

    const value = filter.value;
    if (Array.isArray(value)) {
      return value.join("، ");
    }
    return String(value);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm mb-8 overflow-hidden transition-all duration-300">
      {/* Header with expand/collapse button */}
      <div className="border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-indigo-700">
            <svg
              className="w-5 h-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <h2 className="font-bold">راهنمای فیلترها</h2>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-indigo-600 hover:text-indigo-800 transition-colors"
            aria-expanded={isExpanded}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 transition-transform duration-300 ${
                isExpanded ? "transform rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Collapsible content */}
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="p-6">
          {/* Active filters section */}
          {activeFilters.length > 0 ? (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800">فیلترهای فعال</h3>
                <Link
                  href="/"
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100 transition-all duration-300"
                >
                  <span>پاک کردن همه</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </Link>
              </div>

              {/* Active filter cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {activeFilters.map((filter, index) => (
                  <div
                    key={index}
                    className={`relative flex flex-col rounded-lg border p-4 transition-all duration-300 hover:shadow-md ${getFilterBgClass(
                      filter.key
                    )}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getIconForFilter(filter.key)}
                        <h4 className="font-medium">{filter.label}</h4>
                      </div>
                      <Link
                        href={`/?${new URLSearchParams(
                          Object.fromEntries(
                            activeFilters
                              .filter((f) => f.key !== filter.key)
                              .map((f) => [f.key, String(f.value)])
                          )
                        ).toString()}`}
                        className="text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </Link>
                    </div>
                    <p className="text-sm mt-1 line-clamp-2">
                      {formatFilterValue(filter)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="text-yellow-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-yellow-700">
                  هیچ فیلتر فعالی وجود ندارد. از بخش جستجو می‌توانید به دنبال
                  مقالات مورد نظر خود بگردید.
                </p>
              </div>
            </div>
          )}

          {/* Filter types guide */}
          <h3 className="font-bold text-gray-800 mb-4">
            انواع فیلتر قابل استفاده
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-4 bg-blue-50/50 rounded-lg border border-blue-100 hover:bg-blue-50 transition-all duration-300">
              {filterIcons.search}
              <div>
                <h4 className="font-medium text-gray-800">جستجوی متنی</h4>
                <p className="text-sm text-gray-600 mt-1">
                  جستجو در عنوان، خلاصه و محتوای مقالات با کلیدواژه‌های دلخواه
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-green-50/50 rounded-lg border border-green-100 hover:bg-green-50 transition-all duration-300">
              {filterIcons.author}
              <div>
                <h4 className="font-medium text-gray-800">نویسندگان</h4>
                <p className="text-sm text-gray-600 mt-1">
                  فیلتر مقالات بر اساس نام نویسنده یا پژوهشگر
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-purple-50/50 rounded-lg border border-purple-100 hover:bg-purple-50 transition-all duration-300">
              {filterIcons.tag}
              <div>
                <h4 className="font-medium text-gray-800">
                  برچسب‌ها و کلیدواژه‌ها
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  یافتن مقالات مرتبط با موضوعات و دسته‌بندی‌های خاص
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-amber-50/50 rounded-lg border border-amber-100 hover:bg-amber-50 transition-all duration-300">
              {filterIcons.publication}
              <div>
                <h4 className="font-medium text-gray-800">مجلات و منابع</h4>
                <p className="text-sm text-gray-600 mt-1">
                  جستجو بر اساس نام مجله، ژورنال یا منبع انتشار مقاله
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-cyan-50/50 rounded-lg border border-cyan-100 hover:bg-cyan-50 transition-all duration-300">
              {filterIcons.year}
              <div>
                <h4 className="font-medium text-gray-800">سال انتشار</h4>
                <p className="text-sm text-gray-600 mt-1">
                  محدود کردن نتایج بر اساس بازه زمانی انتشار مقالات
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-indigo-50/50 rounded-lg border border-indigo-100 hover:bg-indigo-50 transition-all duration-300">
              {filterIcons.type}
              <div>
                <h4 className="font-medium text-gray-800">نوع مقاله</h4>
                <p className="text-sm text-gray-600 mt-1">
                  فیلتر بر اساس نوع مقاله (پژوهشی، مروری، کتاب و غیره)
                </p>
              </div>
            </div>
          </div>

          {/* Tips for better search */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <h4 className="font-medium text-gray-800 flex items-center gap-2 mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-indigo-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              نکات جستجوی بهتر
            </h4>
            <ul className="text-sm text-gray-600 space-y-2 mr-5 list-disc">
              <li>برای جستجوی دقیق‌تر، از ترکیب چند فیلتر استفاده کنید</li>
              <li>در جستجوی متنی می‌توانید از عبارات دقیق استفاده کنید</li>
              <li>
                با کلیک روی نام نویسنده یا برچسب در مقالات، فیلتر مربوطه فعال
                می‌شود
              </li>
              <li>
                می‌توانید فیلترها را به صورت تکی حذف کنید یا همه را یکجا پاک
                کنید
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
