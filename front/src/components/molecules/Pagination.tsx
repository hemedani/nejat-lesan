"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FC } from "react";

interface PaginationProps {
  initialPage: number; // صفحه فعلی
  countPage: number; // تعداد کل آیتم‌های دیتابیس
  limit?: number; // تعداد آیتم در هر صفحه
}

const Pagination: FC<PaginationProps> = ({ initialPage, countPage, limit = 20 }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(countPage / limit);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const siblingsCount = 1; // Number of siblings on each side of current page

    // Always include first page
    pageNumbers.push(1);

    if (initialPage > 2 + siblingsCount) {
      pageNumbers.push("ellipsis-start");
    }

    // Add pages around current page
    for (
      let i = Math.max(2, initialPage - siblingsCount);
      i <= Math.min(totalPages - 1, initialPage + siblingsCount);
      i++
    ) {
      pageNumbers.push(i);
    }

    if (initialPage < totalPages - 1 - siblingsCount) {
      pageNumbers.push("ellipsis-end");
    }

    // Always include last page if there's more than one page
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  if (totalPages <= 1) {
    return null; // Don't render pagination if there's only one page
  }

  return (
    <nav aria-label="صفحه‌بندی" className="w-full flex justify-center my-8">
      <div className="flex items-center justify-center gap-2 px-4 py-2 bg-white rounded-xl shadow-md">
        {/* Previous button */}
        <button
          onClick={() => handlePageChange(initialPage - 1)}
          disabled={initialPage === 1}
          aria-label="صفحه قبلی"
          className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors duration-200 ${initialPage === 1
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
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
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span>قبلی</span>
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1 mx-2">
          {getPageNumbers().map((pageNumber, index) => {
            if (pageNumber === "ellipsis-start" || pageNumber === "ellipsis-end") {
              return (
                <span
                  key={`${pageNumber}-${index}`}
                  className="w-9 text-center text-gray-500"
                  aria-hidden="true"
                >
                  ...
                </span>
              );
            }

            return (
              <button
                key={pageNumber}
                onClick={() => handlePageChange(pageNumber as number)}
                aria-label={`صفحه ${pageNumber}`}
                aria-current={pageNumber === initialPage ? "page" : undefined}
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors duration-200 ${pageNumber === initialPage
                  ? "bg-blue-600 text-white font-bold"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                {pageNumber}
              </button>
            );
          })}
        </div>

        {/* Next button */}
        <button
          onClick={() => handlePageChange(initialPage + 1)}
          disabled={initialPage === totalPages}
          aria-label="صفحه بعدی"
          className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors duration-200 ${initialPage === totalPages
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
        >
          <span>بعدی</span>
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
