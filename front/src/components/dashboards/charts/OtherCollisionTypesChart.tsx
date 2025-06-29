'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { ApexOptions } from 'apexcharts'

// Dynamic import to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

// Props interface
interface OtherCollisionTypesChartData {
  name: string
  count: number
}

interface ChartProps {
  data: OtherCollisionTypesChartData[]
  isLoading: boolean
}

const OtherCollisionTypesChart: React.FC<ChartProps> = ({ data, isLoading }) => {
  // Early return for loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">شمار سایر انواع برخورد</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">شمار سایر انواع برخورد</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v7h-2l-1-2H8l-1 2H5V5z" />
            </svg>
            <h4 className="text-lg font-medium text-gray-900 mb-2">داده‌ای موجود نیست</h4>
            <p className="text-gray-600">اطلاعات سایر انواع برخورد در فیلترهای انتخابی یافت نشد.</p>
          </div>
        </div>
      </div>
    )
  }

  // Sort data by count for better visualization
  const sortedData = [...data].sort((a, b) => b.count - a.count)

  // Prepare chart data
  const chartCategories = sortedData.map(item => item.name)
  const chartSeries = sortedData.map(item => item.count)
  const totalCount = chartSeries.reduce((sum, count) => sum + count, 0)
  const maxValue = Math.max(...chartSeries)

  // Bar chart options
  const barOptions: ApexOptions = {
    chart: {
      type: 'bar',
      fontFamily: 'inherit',
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false
        }
      }
    },

    xaxis: {
      categories: chartCategories,
      labels: {
        style: {
          fontSize: '12px',
          fontWeight: 500,
          colors: '#374151'
        },
        rotate: -45,
        maxHeight: 120
      },
      axisBorder: {
        show: true,
        color: '#E5E7EB'
      },
      axisTicks: {
        show: true,
        color: '#E5E7EB'
      }
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '12px',
          fontWeight: 500,
          colors: '#374151'
        },
        formatter: (val: number) => val.toLocaleString()
      },
      title: {
        text: 'تعداد موارد',
        style: {
          fontSize: '14px',
          fontWeight: 600,
          color: '#374151'
        }
      }
    },
    colors: ['#8B5CF6'],
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '70%',
        dataLabels: {
          position: 'top'
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => val.toLocaleString(),
      offsetY: -20,
      style: {
        fontSize: '11px',
        fontWeight: 600,
        colors: ['#374151']
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
    grid: {
      show: true,
      borderColor: '#F3F4F6',
      strokeDashArray: 3,
      xaxis: {
        lines: {
          show: false
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      }
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          plotOptions: {
            bar: {
              columnWidth: '80%'
            }
          },
          xaxis: {
            labels: {
              rotate: -90,
              maxHeight: 150
            }
          }
        }
      }
    ]
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">شمار سایر انواع برخورد</h3>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v7h-2l-1-2H8l-1 2H5V5z" clipRule="evenodd" />
            </svg>
            <span>{totalCount.toLocaleString()} مورد</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            <span>{data.length} نوع</span>
          </div>
        </div>
      </div>

      <div className="h-96">
        <Chart
          options={barOptions}
          series={[
            {
              name: 'تعداد موارد',
              data: chartSeries
            }
          ]}
          type="bar"
          height="100%"
        />
      </div>

      {/* Data Summary Table */}
      <div className="mt-6 border-t pt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">جزئیات سایر انواع برخورد</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {sortedData.slice(0, Math.ceil(sortedData.length / 2)).map((item, index) => {
              const percentage = ((item.count / totalCount) * 100).toFixed(1)
              const relativeHeight = (item.count / maxValue) * 100
              return (
                <div key={index} className="flex items-center justify-between py-2 px-3 rounded hover:bg-gray-50 border-r-2 border-purple-200">
                  <div className="flex-1">
                    <span className="text-sm text-gray-700 font-medium">{item.name}</span>
                    <div className="mt-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${relativeHeight}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <span className="text-sm font-bold text-gray-900">{item.count.toLocaleString()}</span>
                    <div className="text-xs text-gray-500">({percentage}%)</div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {sortedData.slice(Math.ceil(sortedData.length / 2)).map((item, index) => {
              const percentage = ((item.count / totalCount) * 100).toFixed(1)
              const relativeHeight = (item.count / maxValue) * 100
              return (
                <div key={index} className="flex items-center justify-between py-2 px-3 rounded hover:bg-gray-50 border-r-2 border-purple-200">
                  <div className="flex-1">
                    <span className="text-sm text-gray-700 font-medium">{item.name}</span>
                    <div className="mt-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${relativeHeight}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <span className="text-sm font-bold text-gray-900">{item.count.toLocaleString()}</span>
                    <div className="text-xs text-gray-500">({percentage}%)</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="text-xs text-purple-600 font-medium">بیشترین مورد</div>
          <div className="text-sm font-bold text-purple-900">{sortedData[0]?.name || 'نامشخص'}</div>
          <div className="text-xs text-purple-700">{sortedData[0]?.count.toLocaleString() || 0} مورد</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-600 font-medium">میانگین موارد</div>
          <div className="text-sm font-bold text-gray-900">{Math.round(totalCount / data.length).toLocaleString()}</div>
          <div className="text-xs text-gray-700">به ازای هر نوع</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-xs text-blue-600 font-medium">تنوع انواع</div>
          <div className="text-sm font-bold text-blue-900">{data.length}</div>
          <div className="text-xs text-blue-700">نوع مختلف</div>
        </div>
      </div>
    </div>
  )
}

export default OtherCollisionTypesChart
