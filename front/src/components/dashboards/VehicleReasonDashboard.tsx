'use client'

import React from 'react'
import VehicleReasonPieChart from '@/components/charts/VehicleReasonPieChart'
import VehicleReasonBarChart from '@/components/charts/VehicleReasonBarChart'

interface VehicleReasonDashboardProps {
  data: {
    pieChart: Array<{
      name: string
      count: number
    }>
    barChart: {
      categories: string[]
      series: Array<{
        name: string
        data: number[]
      }>
    }
  } | null
  isLoading: boolean
}

const VehicleReasonDashboard: React.FC<VehicleReasonDashboardProps> = ({
  data,
  isLoading
}) => {
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pie Chart Loading Skeleton */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-80 bg-gray-100 rounded flex items-center justify-center">
                <div className="flex items-center gap-2 text-gray-500">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm">در حال بارگذاری نمودار دایره‌ای...</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bar Chart Loading Skeleton */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-80 bg-gray-100 rounded flex items-center justify-center">
                <div className="flex items-center gap-2 text-gray-500">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm">در حال بارگذاری نمودار میله‌ای...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // No data state
  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">هیچ داده‌ای موجود نیست</h3>
          <p className="text-gray-600">
            لطفاً فیلترهای مورد نظر را اعمال کرده و دکمه &quot;اعمال فیلترها&quot; را فشار دهید
          </p>
        </div>
      </div>
    )
  }

  // Empty data state
  if (data.pieChart.length === 0 && data.barChart.categories.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">داده‌ای برای نمایش وجود ندارد</h3>
          <p className="text-gray-600">
            با فیلترهای انتخابی، هیچ تصادفی یافت نشد. لطفاً فیلترهای دیگری را امتحان کنید
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie Chart - Vehicle Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <VehicleReasonPieChart
            data={data.pieChart}
            isLoading={false}
          />
        </div>

        {/* Bar Chart - Vehicle Reasons */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <VehicleReasonBarChart
            data={data.barChart}
            isLoading={false}
          />
        </div>
      </div>

      {/* Additional Information Panel */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">راهنمای تفسیر نمودارها</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>
                <strong>نمودار دایره‌ای (چپ):</strong> نسبت وسایل نقلیه دارای عامل به وسایل بدون عامل را نشان می‌دهد
              </p>
              <p>
                <strong>نمودار میله‌ای (راست):</strong> توزیع انواع عوامل مؤثر وسیله نقلیه در تصادفات را نمایش می‌دهد
              </p>
              <p className="text-blue-700">
                💡 برای تحلیل دقیق‌تر، از فیلترهای جانبی برای محدود کردن داده‌ها به بازه زمانی یا منطقه جغرافیایی خاص استفاده کنید
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VehicleReasonDashboard
