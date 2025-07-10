"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";

// Components
import ChartNavigation from "@/components/navigation/ChartNavigation";
import AppliedFiltersDisplay from "@/components/dashboards/AppliedFiltersDisplay";

// Context
import { useMapComparison } from "@/context/MapComparisonContext";

const MapComparisonPage: React.FC = () => {
  const { comparisonItems, removeComparison, clearComparisons } =
    useMapComparison();

  // Handle individual comparison removal
  const handleRemoveComparison = (id: string) => {
    removeComparison(id);
    toast.success("مقایسه حذف شد");
  };

  // Handle clearing all comparisons
  const handleClearAll = () => {
    if (comparisonItems.length === 0) return;

    const confirmed = window.confirm(
      "آیا مطمئن هستید که می‌خواهید همه مقایسه‌ها را حذف کنید؟",
    );

    if (confirmed) {
      clearComparisons();
      toast.success("همه مقایسه‌ها حذف شدند");
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <ChartNavigation />

      {/* Main Content */}
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                مقایسه نقشه‌ها
              </h1>
              <p className="text-gray-600 mt-2">
                مقایسه تصاویر ذخیره شده از نقشه‌های تصادفات با فیلترهای مختلف
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/maps/accidents"
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                افزودن مقایسه جدید
              </Link>
              {comparisonItems.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  حذف همه
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {comparisonItems.length}
                  </div>
                  <div className="text-sm text-gray-600">مقایسه ذخیره شده</div>
                </div>
                {comparisonItems.length > 0 && (
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">
                      {formatDate(
                        comparisonItems[comparisonItems.length - 1].createdAt,
                      )}
                    </div>
                    <div className="text-sm text-gray-600">آخرین مقایسه</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {comparisonItems.length === 0 ? (
          // Empty state
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="mb-6">
                <svg
                  className="w-20 h-20 text-gray-400 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                هیچ مقایسه‌ای ذخیره نشده است
              </h3>
              <p className="text-gray-600 mb-6">
                برای شروع، به صفحه نقشه تصادفات بروید و با استفاده از دکمه
                &quot;ارسال برای مقایسه&quot; تصاویری از نقشه‌های خود با
                فیلترهای مختلف ذخیره کنید.
              </p>
              <Link
                href="/maps/accidents"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
                رفتن به نقشه تصادفات
              </Link>
            </div>
          </div>
        ) : (
          // Comparison grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {comparisonItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm mb-1">
                        {item.title || "نقشه تصادفات"}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {formatDate(item.createdAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveComparison(item.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="حذف این مقایسه"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Map Image */}
                <div className="relative">
                  <Image
                    src={item.imageDataUrl}
                    alt={`نقشه تصادفات - ${item.title}`}
                    className="w-full h-48 object-cover"
                    width={400}
                    height={192}
                    unoptimized
                  />
                  <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                    تصویر نقشه
                  </div>
                </div>

                {/* Applied Filters */}
                <div className="p-4">
                  <h4 className="font-medium text-gray-900 mb-3 text-sm">
                    فیلترهای اعمال شده:
                  </h4>
                  <div className="max-h-32 overflow-y-auto">
                    <AppliedFiltersDisplay filters={item.filters} />
                  </div>
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>شناسه: {item.id}</span>
                    <span>ذخیره شده</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapComparisonPage;
