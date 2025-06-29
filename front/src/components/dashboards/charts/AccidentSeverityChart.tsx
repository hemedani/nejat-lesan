'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { ApexOptions } from 'apexcharts'

// Dynamic import to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

// Props interface
interface AccidentSeverityData {
  name: string
  count: number
}

interface ChartProps {
  data: AccidentSeverityData[] | null
  isLoading: boolean
  isDamageActive: boolean
}

const AccidentSeverityChart: React.FC<ChartProps> = ({ data, isLoading, isDamageActive }) => {
  // Early return for loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">سهم شدت تصادفات</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">در حال بارگذاری...</p>
          </div>
        </div>
      </div>
    )
  }

  // Early return for no data state
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">سهم شدت تصادفات</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h4 className="text-lg font-medium text-gray-900 mb-2">داده‌ای موجود نیست</h4>
            <p className="text-gray-600">اطلاعات شدت تصادفات در فیلترهای انتخابی یافت نشد.</p>
          </div>
        </div>
      </div>
    )
  }

  // Calculate chart data based on damage filter status
  let chartSeries: number[] = []
  let chartLabels: string[] = []
  let filteredData: AccidentSeverityData[] = []
  let totalCount = 0

  if (data) {
    const fatal = data.find(d => d.name === 'فوتی')?.count || 0
    const injury = data.find(d => d.name === 'جرحی')?.count || 0
    const damage = data.find(d => d.name === 'خسارتی')?.count || 0

    if (isDamageActive) {
      // Show all three types if damage filter is active
      totalCount = fatal + injury + damage
      if (totalCount > 0) {
        chartSeries = [fatal, injury, damage]
        chartLabels = ['فوتی', 'جرحی', 'خسارتی']
        filteredData = [
          { name: 'فوتی', count: fatal },
          { name: 'جرحی', count: injury },
          { name: 'خسارتی', count: damage }
        ]
      }
    } else {
      // Show only fatal and injury if damage filter is not active
      totalCount = fatal + injury
      if (totalCount > 0) {
        chartSeries = [fatal, injury]
        chartLabels = ['فوتی', 'جرحی']
        filteredData = [
          { name: 'فوتی', count: fatal },
          { name: 'جرحی', count: injury }
        ]
      }
    }
  }

  // If no valid data to show
  if (totalCount === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">سهم شدت تصادفات</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h4 className="text-lg font-medium text-gray-900 mb-2">داده‌ای موجود نیست</h4>
            <p className="text-gray-600">
              {isDamageActive
                ? 'اطلاعات شدت تصادفات (شامل خسارتی) در فیلترهای انتخابی یافت نشد.'
                : 'اطلاعات تصادفات فوتی و جرحی در فیلترهای انتخابی یافت نشد.'
              }
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Color scheme for different severity types
  const severityColors = {
    'فوتی': '#EF4444', // Red for fatal
    'جرحی': '#F59E0B', // Orange for injury
    'خسارتی': '#10B981' // Green for damage
  }

  const chartColors = chartLabels.map(label => severityColors[label as keyof typeof severityColors])

  // Doughnut chart options
  const doughnutOptions: ApexOptions = {
    chart: {
      type: 'donut',
      fontFamily: 'inherit',
      toolbar: {
        show: false
      }
    },
    series: chartSeries,
    labels: chartLabels,
    colors: chartColors,
    legend: {
      position: 'bottom',
      fontSize: '14px',
      fontWeight: 500,
      labels: {
        colors: '#374151'
      },
      markers: {
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '60%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'مجموع',
              fontSize: '16px',
              fontWeight: 600,
              color: '#374151',
              formatter: () => totalCount.toLocaleString()
            },
            value: {
              show: true,
              fontSize: '24px',
              fontWeight: 700,
              color: '#111827',
              formatter: (val: string) => parseInt(val).toLocaleString()
            }
          }
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
      style: {
        fontSize: '12px',
        fontWeight: 600,
        colors: ['#FFFFFF']
      },
      dropShadow: {
        enabled: true,
        color: '#000000',
        opacity: 0.3
      }
    },
    tooltip: {
      enabled: true,
      y: {
        formatter: (val: number) => `${val.toLocaleString()} مورد`
      },
      style: {
        fontSize: '12px'
      }
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          legend: {
            position: 'bottom'
          },
          plotOptions: {
            pie: {
              donut: {
                size: '70%'
              }
            }
          }
        }
      }
    ]
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">سهم شدت تصادفات</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2C5.582 2 2 5.582 2 10s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8zM9 4a1 1 0 112 0v4a1 1 0 11-2 0V4zm0 8a1 1 0 112 0v2a1 1 0 11-2 0v-2z" clipRule="evenodd" />
            </svg>
            <span>{totalCount.toLocaleString()} مورد</span>
          </div>
          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {isDamageActive ? 'شامل خسارتی' : 'فقط فوتی و جرحی'}
          </div>
        </div>
      </div>

      <div className="h-80">
        <Chart
          options={doughnutOptions}
          series={chartSeries}
          type="donut"
          height="100%"
        />
      </div>

      {/* Data Summary Table */}
      <div className="mt-6 border-t pt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">جزئیات شدت تصادفات</h4>
        <div className="space-y-2">
          {filteredData
            .sort((a, b) => b.count - a.count)
            .map((item, index) => {
              const percentage = ((item.count / totalCount) * 100).toFixed(1)
              const color = severityColors[item.name as keyof typeof severityColors]
              return (
                <div key={index} className="flex items-center justify-between py-2 px-3 rounded hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: color }}
                    ></div>
                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-900">{item.count.toLocaleString()}</span>
                    <span className="text-xs text-gray-500 mr-2">({percentage}%)</span>
                  </div>
                </div>
              )
            })}
        </div>
      </div>

      {/* Filter Status Info */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-xs text-blue-700">
            <p className="font-medium mb-1">نحوه محاسبه درصدها:</p>
            <p>
              {isDamageActive
                ? 'درصدها بر اساس مجموع کل تصادفات (فوتی + جرحی + خسارتی) محاسبه شده‌اند.'
                : 'درصدها بر اساس مجموع تصادفات شدید (فوتی + جرحی) محاسبه شده‌اند.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccidentSeverityChart
