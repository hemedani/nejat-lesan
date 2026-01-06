"use client";

import React from "react";
import { formatNumber } from "@/utils/formatters";
import MainCollisionChart from "./charts/MainCollisionChart";
import SingleVehicleChart from "./charts/SingleVehicleChart";
import OtherCollisionTypesChart from "./charts/OtherCollisionTypesChart";

// Props interface for the dashboard component
interface CollisionAnalyticsData {
  mainChart: Array<{
    name: string;
    count: number;
  }>;
  singleVehicleChart: Array<{
    name: string;
    count: number;
  }>;
  otherTypesChart: Array<{
    name: string;
    count: number;
  }>;
}

interface DashboardProps {
  data: CollisionAnalyticsData | null;
  isLoading: boolean;
}

const CollisionAnalyticsDashboard: React.FC<DashboardProps> = ({ data, isLoading }) => {
  // Early return for loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">در حال بارگذاری اطلاعات تحلیل برخورد...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Early return for no data state
  if (!data) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">داده‌ای یافت نشد</h3>
              <p className="text-gray-600">لطفاً فیلترهای مناسب را اعمال کرده و دوباره تلاش کنید.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate summary statistics
  const totalMainCollisions = data.mainChart.reduce((sum, item) => sum + item.count, 0);
  const totalSingleVehicle = data.singleVehicleChart.reduce((sum, item) => sum + item.count, 0);
  const totalOtherTypes = data.otherTypesChart.reduce((sum, item) => sum + item.count, 0);
  const grandTotal = totalMainCollisions + totalSingleVehicle + totalOtherTypes;

  const mostCommonMainType =
    data.mainChart.length > 0
      ? data.mainChart.reduce((max, item) => (item.count > max.count ? item : max), data.mainChart[0])
          .name
      : "نامشخص";

  const mostCommonSingleVehicleType =
    data.singleVehicleChart.length > 0
      ? data.singleVehicleChart.reduce(
          (max, item) => (item.count > max.count ? item : max),
          data.singleVehicleChart[0],
        ).name
      : "نامشخص";

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border-r-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">کل تصادفات</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(grandTotal)}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border-r-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">برخوردهای اصلی</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(totalMainCollisions)}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border-r-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">تک وسیله‌ای</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(totalSingleVehicle)}</p>
            </div>
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border-r-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">سایر انواع</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(totalOtherTypes)}</p>
            </div>
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v7h-2l-1-2H8l-1 2H5V5z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">نکات کلیدی</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">شایع‌ترین نوع برخورد اصلی</h4>
            <p className="text-blue-700">{mostCommonMainType}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">شایع‌ترین نوع تصادف تک وسیله‌ای</h4>
            <p className="text-yellow-700">{mostCommonSingleVehicleType}</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Main Collision Types Chart */}
        <div className="lg:col-span-1">
          <MainCollisionChart data={data.mainChart} isLoading={false} />
        </div>

        {/* Single Vehicle Chart */}
        <div className="lg:col-span-1">
          <SingleVehicleChart data={data.singleVehicleChart} isLoading={false} />
        </div>

        {/* Other Collision Types Chart - Full width */}
        <div className="lg:col-span-2">
          <OtherCollisionTypesChart data={data.otherTypesChart} isLoading={false} />
        </div>
      </div>
    </div>
  );
};

export default CollisionAnalyticsDashboard;
