'use client'

import React, { useState, useEffect } from 'react'
import EffectiveRoadDefectsDashboard from '@/components/dashboards/EffectiveRoadDefectsDashboard'
import MonthlyHolidayAnalyticsDashboard from '@/components/dashboards/MonthlyHolidayAnalyticsDashboard'
import ChartsFilterSidebar, { RoadDefectsFilterState } from '@/components/dashboards/ChartsFilterSidebar'
import ChartNavigation from '@/components/navigation/ChartNavigation'
import { roadDefectsAnalytics } from '@/app/actions/accident/roadDefectsAnalytics'
import { monthlyHolidayAnalytics } from '@/app/actions/accident/monthlyHolidayAnalytics'

// Backend response interface for road defects analytics
interface RoadDefectsAnalyticsData {
  defectDistribution: {
    withDefect: number
    withoutDefect: number
  }
  defectCounts: Array<{
    name: string
    count: number
  }>
  severityBreakdown: Array<{
    severity: string
    withDefect: number
    withoutDefect: number
  }>
}

// Backend response interface for monthly holiday analytics
interface MonthlyHolidayAnalyticsData {
  categories: string[]
  series: Array<{
    name: string
    data: number[]
  }>
}

const OverallChartsPage = () => {
  const [showFilterSidebar, setShowFilterSidebar] = useState(true)
  const [chartData, setChartData] = useState<RoadDefectsAnalyticsData | null>(null)
  const [monthlyHolidayData, setMonthlyHolidayData] = useState<MonthlyHolidayAnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load initial data on component mount
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [roadDefectsResult, monthlyHolidayResult] = await Promise.all([
        roadDefectsAnalytics({
          set: {
            lightStatus: [],
            collisionType: [],
            dateOfAccidentFrom: '',
            dateOfAccidentTo: ''
          },
          get: {
            defectDistribution: 1,
            defectCounts: 1
          }
        }),
        monthlyHolidayAnalytics({
          set: {
            lightStatus: [],
            collisionType: [],
            dateOfAccidentFrom: '',
            dateOfAccidentTo: ''
          },
          get: {
            categories: 1,
            series: 1
          }
        })
      ])

      if (roadDefectsResult.success) {
        setChartData(roadDefectsResult.body)
      } else {
        setError(roadDefectsResult.error || 'خطا در بارگذاری داده‌های نقص راه')
      }

      if (monthlyHolidayResult.success) {
        setMonthlyHolidayData(monthlyHolidayResult.body)
      } else {
        console.warn('Warning loading monthly holiday data:', monthlyHolidayResult.error)
      }
    } catch {
      setError('خطا در برقراری ارتباط با سرور')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle filter submission
  const handleFilterSubmit = async (filters: RoadDefectsFilterState) => {
    setIsLoading(true)
    setError(null)

    try {
      const [roadDefectsResult, monthlyHolidayResult] = await Promise.all([
        roadDefectsAnalytics({
          set: {
            province: filters.province || [],
            city: filters.city || [],
            dateOfAccidentFrom: filters.dateOfAccidentFrom || '',
            dateOfAccidentTo: filters.dateOfAccidentTo || '',
            lightStatus: filters.lightStatus || [],
            collisionType: filters.collisionType || [],
            roadDefects: filters.roadDefects || [],
            airStatuses: filters.airStatuses || [],
            areaUsages: filters.areaUsages || [],
            roadSurfaceConditions: filters.roadSurfaceConditions || [],
            deadCountMin: filters.deadCountMin,
            deadCountMax: filters.deadCountMax,
            injuredCountMin: filters.injuredCountMin,
            injuredCountMax: filters.injuredCountMax
          },
          get: {
            defectDistribution: 1,
            defectCounts: 1
          }
        }),
        monthlyHolidayAnalytics({
          set: {
            province: filters.province || [],
            city: filters.city || [],
            dateOfAccidentFrom: filters.dateOfAccidentFrom || '',
            dateOfAccidentTo: filters.dateOfAccidentTo || '',
            lightStatus: filters.lightStatus || [],
            collisionType: filters.collisionType || [],
            roadDefects: filters.roadDefects || [],
            airStatuses: filters.airStatuses || [],
            areaUsages: filters.areaUsages || [],
            roadSurfaceConditions: filters.roadSurfaceConditions || [],
            deadCountMin: filters.deadCountMin,
            deadCountMax: filters.deadCountMax,
            injuredCountMin: filters.injuredCountMin,
            injuredCountMax: filters.injuredCountMax
          },
          get: {
            categories: 1,
            series: 1
          }
        })
      ])

      if (roadDefectsResult.success) {
        setChartData(roadDefectsResult.body)
      } else {
        setError(roadDefectsResult.error || 'خطا در بارگذاری داده‌های نقص راه')
      }

      if (monthlyHolidayResult.success) {
        setMonthlyHolidayData(monthlyHolidayResult.body)
      }
    } catch {
      setError('خطا در برقراری ارتباط با سرور')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle manual data loading
  const handleLoadData = async () => {
    await loadInitialData()
  }

  // Filter configuration
  const getFilterConfig = () => {
    return {
      disableSeverityFilter: false,
      disableCollisionTypeFilter: false,
      disableLightingFilter: false,
      lockToSevereAccidents: true // Lock to severe accidents for road defects analysis
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <ChartNavigation currentSection="overall" />

      <div className="flex">
        {/* Filter Sidebar */}
        {showFilterSidebar && (
          <div className="w-80 flex-shrink-0">
            <ChartsFilterSidebar
              onApplyFilters={handleFilterSubmit}
              config={getFilterConfig()}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">دید کلی</h1>
                <p className="text-sm text-gray-600 mt-1">
                  نمایش کلی از داده‌های تصادفات و تحلیل‌های مرتبط
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleLoadData}
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                  {isLoading ? 'در حال بارگذاری...' : 'بارگذاری مجدد'}
                </button>
                <button
                  onClick={() => setShowFilterSidebar(!showFilterSidebar)}
                  className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                  {showFilterSidebar ? 'مخفی کردن فیلتر' : 'نمایش فیلتر'}
                </button>
              </div>
            </div>
          </div>

          {/* Charts Content */}
          <div className="space-y-6">
            {/* Error Display */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <h3 className="font-medium text-red-800">خطا</h3>
                </div>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {chartData && (() => {
              const totalAccidents = chartData.defectDistribution.withDefect + chartData.defectDistribution.withoutDefect
              const defectPercentage = ((chartData.defectDistribution.withDefect / totalAccidents) * 100).toFixed(1)
              const mostCommonDefect = chartData.defectCounts.length > 0 ? chartData.defectCounts[0].name : 'نامشخص'

              return (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <h3 className="font-medium text-green-800">داده‌ها بارگذاری شد</h3>
                  </div>
                  <p className="text-sm text-green-700">
                    تحلیل {totalAccidents} تصادف با نرخ نقص راه {defectPercentage}% - شایع‌ترین نقص: {mostCommonDefect}
                  </p>
                </div>
              )
            })()}

            {/* Quick Navigation to Individual Charts */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">دسترسی سریع به نمودارها</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <a
                  href="/charts/overall/road-defects"
                  className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">نقص راه</h3>
                      <p className="text-sm text-gray-600">تحلیل نقص‌های راه و تأثیر آن بر تصادفات</p>
                    </div>
                  </div>
                </a>
                <a
                  href="/charts/overall/monthly-holiday"
                  className="block p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">تحلیل ماهانه تعطیلات</h3>
                      <p className="text-sm text-gray-600">مقایسه تصادفات در روزهای تعطیل و غیرتعطیل</p>
                    </div>
                  </div>
                </a>
                <a
                  href="/charts/overall/hourly-day-of-week"
                  className="block p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">تحلیل ساعتی روز هفته</h3>
                      <p className="text-sm text-gray-600">نمودار حرارتی توزیع تصادفات بر اساس ساعت و روز</p>
                    </div>
                  </div>
                </a>
                <a
                  href="/charts/overall/collision-analytics"
                  className="block p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">تحلیل انواع برخورد</h3>
                      <p className="text-sm text-gray-600">تحلیل جامع انواع برخورد و تصادفات تک وسیله‌ای</p>
                    </div>
                  </div>
                </a>
                <a
                  href="/charts/overall/total-reason-analytics"
                  className="block p-4 border border-gray-200 rounded-lg hover:border-amber-300 hover:bg-amber-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">علل تامه تصادفات</h3>
                      <p className="text-sm text-gray-600">توزیع علت تامه تصادفات شدید در قالب نمودار درختی</p>
                    </div>
                  </div>
                </a>
                <a
                  href="/charts/overall/human-reason-analytics"
                  className="block p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">عوامل انسانی مؤثر</h3>
                      <p className="text-sm text-gray-600">توزیع عوامل انسانی مؤثر در تصادفات به صورت نمودار درختی</p>
                    </div>
                  </div>
                </a>
                <a
                  href="/charts/overall/area-usage-analytics"
                  className="block p-4 border border-gray-200 rounded-lg hover:border-pink-300 hover:bg-pink-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">سهم تصادفات به تفکیک کاربری محل</h3>
                      <p className="text-sm text-gray-600">تحلیل توزیع تصادفات بر اساس نوع کاربری محل وقوع با نمودار دایره‌ای</p>
                    </div>
                  </div>
                </a>
                <a
                  href="/charts/overall/vehicle-reason-analytics"
                  className="block p-4 border border-gray-200 rounded-lg hover:border-teal-300 hover:bg-teal-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12a3 3 0 000 6h6a3 3 0 000-6H9zm0 0V6a3 3 0 016 0v6m-6 0H6a3 3 0 00-3 3v3a3 3 0 003 3h12a3 3 0 003-3v-3a3 3 0 00-3-3h-3" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">توزیع عامل وسیله نقلیه</h3>
                      <p className="text-sm text-gray-600">تحلیل عوامل مؤثر وسیله نقلیه در تصادفات با نمودار دایره‌ای و میله‌ای</p>
                    </div>
                  </div>
                </a>
                <a
                  href="/charts/overall/company-performance-analytics"
                  className="block p-4 border border-gray-200 rounded-lg hover:border-cyan-300 hover:bg-cyan-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 17h4a2 2 0 002-2V9a2 2 0 00-2-2H7a2 2 0 00-2 2v6a2 2 0 002 2h4m2 0a9 9 0 11-8 0" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">مقایسه عملکرد کمپانیهای سازنده خودرو</h3>
                      <p className="text-sm text-gray-600">نمودار حبابی مقایسه کمپانی‌ها بر اساس سهم تصادفات و شدت آسیب</p>
                    </div>
                  </div>
                </a>
              </div>
            </div>

            {/* Road Defects Dashboard */}
            <EffectiveRoadDefectsDashboard
              data={chartData}
              isLoading={isLoading}
            />

            {/* Monthly Holiday Dashboard */}
            <div className="mt-6">
              <MonthlyHolidayAnalyticsDashboard
                data={monthlyHolidayData}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OverallChartsPage
