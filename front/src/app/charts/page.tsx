'use client'

import React, { useState, useEffect } from 'react'
import EffectiveRoadDefectsDashboard from '@/components/dashboards/EffectiveRoadDefectsDashboard'
import ChartsFilterSidebar, { RoadDefectsFilterState } from '@/components/dashboards/ChartsFilterSidebar'
import { roadDefectsAnalytics } from '@/app/actions/accident/roadDefectsAnalytics'

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
}

// Tab types
type MainTab = 'charts' | 'maps'
type ChartSubTab = 'overall' | 'temporal' | 'spatial' | 'trend'

// Interface for tab structure
interface TabItem {
  id: string
  label: string
  icon?: React.ReactNode
}

const ChartsPage = () => {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('charts')
  const [activeSubTab, setActiveSubTab] = useState<ChartSubTab>('overall')
  const [showFilterSidebar, setShowFilterSidebar] = useState(true)
  const [chartData, setChartData] = useState<RoadDefectsAnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load initial data on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Load with default/empty filters for initial view
        const response = await roadDefectsAnalytics({ set: {}, get: {defectCounts: 1, defectDistribution: 1} })

        if (response.success) {
          setChartData(response.body)
        } else {
          throw new Error('Failed to fetch initial data')
        }
      } catch (error) {
        console.error('Error fetching initial chart data:', error)
        setError('خطا در دریافت اطلاعات اولیه. لطفاً صفحه را مجدداً بارگذاری کنید.')
      } finally {
        setIsLoading(false)
      }
    }

    // Only load initial data for the overall tab
    if (activeMainTab === 'charts' && activeSubTab === 'overall') {
      loadInitialData()
    }
  }, [activeMainTab, activeSubTab])

  // Main tabs configuration
  const mainTabs: TabItem[] = [
    {
      id: 'charts',
      label: 'نمودارها',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
        </svg>
      )
    },
    {
      id: 'maps',
      label: 'نقشه‌ها',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
        </svg>
      )
    }
  ]

  // Chart sub-tabs configuration
  const chartSubTabs: TabItem[] = [
    { id: 'overall', label: 'دید کلی' },
    { id: 'temporal', label: 'مقایسه زمانی' },
    { id: 'spatial', label: 'مقایسه مکانی' },
    { id: 'trend', label: 'روند رویداد' }
  ]

  // Handle manual data loading
  const handleLoadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Load with default/empty filters
      const response = await roadDefectsAnalytics({
        set: {},
        get: { defectDistribution: 1, defectCounts: 1 }
      })

      if (response.success) {
        setChartData(response.body)
      } else {
        throw new Error('Failed to fetch data')
      }
    } catch (error) {
      console.error('Error fetching chart data:', error)
      setError('خطا در دریافت اطلاعات. لطفاً دوباره تلاش کنید.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle filter application with backend API call
  const handleApplyFilters = async (filters: RoadDefectsFilterState) => {
    setIsLoading(true)
    setError(null)

    try {
      // Call the server action for road defects analytics
      console.log('Applying filters:', filters)
      const response = await roadDefectsAnalytics({ set: filters, get: { defectCounts: 1, defectDistribution: 1} })

      if (response.success) {
        setChartData(response.body)
      } else {
        throw new Error('Failed to fetch data')
      }
    } catch (error) {
      console.error('Error fetching chart data:', error)
      setError('خطا در دریافت اطلاعات. لطفاً دوباره تلاش کنید.')
    } finally {
      setIsLoading(false)
    }
  }

  // Configuration for different dashboards
  const getFilterConfig = () => {
    if (activeSubTab === 'overall') {
      return {
        disableSeverityFilter: false,
        disableCollisionTypeFilter: false,
        disableLightingFilter: false,
        lockToSevereAccidents: true // Lock to severe accidents for road defects analysis
      }
    }
    return {
      disableSeverityFilter: false,
      disableCollisionTypeFilter: false,
      disableLightingFilter: false,
      lockToSevereAccidents: false
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      <div className="flex-1 max-w-7xl mx-auto p-6">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              تحلیل و بررسی ایمنی ترافیک
            </h1>
            <p className="text-gray-600">
              نمایش داده‌های آماری و تحلیلی حوادث ترافیکی به صورت تعاملی
            </p>
          </div>
          <div className="flex items-center gap-3">
            {activeMainTab === 'charts' && activeSubTab === 'overall' && (
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
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                )}
                {isLoading ? 'در حال بارگذاری...' : 'بارگذاری داده‌ها'}
              </button>
            )}
            <button
              onClick={() => setShowFilterSidebar(!showFilterSidebar)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
              {showFilterSidebar ? 'مخفی کردن فیلترها' : 'نمایش فیلترها'}
            </button>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 space-x-reverse px-6">
              {mainTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveMainTab(tab.id as MainTab)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeMainTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Sub Tabs for Charts */}
          {activeMainTab === 'charts' && (
            <div className="px-6 py-2">
              <nav className="flex space-x-6 space-x-reverse">
                {chartSubTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id as ChartSubTab)}
                    className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      activeSubTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          {activeMainTab === 'charts' && activeSubTab === 'overall' && (
            <div>
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

              <EffectiveRoadDefectsDashboard
                data={chartData}
                isLoading={isLoading}
              />
            </div>
          )}

          {activeMainTab === 'charts' && activeSubTab === 'temporal' && (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">مقایسه زمانی</h3>
                <p>این بخش در حال توسعه است</p>
              </div>
            </div>
          )}

          {activeMainTab === 'charts' && activeSubTab === 'spatial' && (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">مقایسه مکانی</h3>
                <p>این بخش در حال توسعه است</p>
              </div>
            </div>
          )}

          {activeMainTab === 'charts' && activeSubTab === 'trend' && (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">روند رویداد</h3>
                <p>این بخش در حال توسعه است</p>
              </div>
            </div>
          )}

          {activeMainTab === 'maps' && (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">نقشه‌ها</h3>
                <p>این بخش در حال توسعه است</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter Sidebar */}
      {showFilterSidebar && activeMainTab === 'charts' && (
        <ChartsFilterSidebar
          config={getFilterConfig()}
          onApplyFilters={handleApplyFilters}
        />
      )}
    </div>
  )
}



export default ChartsPage
