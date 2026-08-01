'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { ApexOptions } from 'apexcharts'

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface VehicleReasonBarChartProps {
  data: {
    categories: string[]
    series: Array<{
      name: string
      data: number[]
    }>
  } | null
  isLoading: boolean
}

const SEVERITY_CHART_COLORS: Record<string, string> = {
  'فوتی': '#ef4444',
  'جرحی': '#f97316',
  'خسارتی': '#eab308',
}

const SEVERITY_DOT_COLORS: Record<string, string> = {
  'فوتی': 'bg-red-500',
  'جرحی': 'bg-orange-500',
  'خسارتی': 'bg-yellow-500',
}

const DEFAULT_COLOR = '#3b82f6'

const VehicleReasonBarChart: React.FC<VehicleReasonBarChartProps> = ({
  data,
  isLoading
}) => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-80 bg-gray-100 rounded flex items-center justify-center">
            <div className="flex items-center gap-2 text-gray-500">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm">در حال بارگذاری...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // No data state
  if (!data || data.categories.length === 0 || data.series.length === 0) {
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">عامل وسیله نقلیه مؤثر در تصادف</h3>
        <div className="h-80 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm">داده‌ای برای نمایش وجود ندارد</p>
          </div>
        </div>
      </div>
    )
  }

  // Calculate per-category totals across all severity series
  const categoryTotals = data.categories.map((_, index) =>
    data.series.reduce((sum, series) => sum + (series.data[index] || 0), 0)
  )
  const totalFaults = categoryTotals.reduce((sum, count) => sum + count, 0)
  const maxFault = Math.max(...categoryTotals)
  const maxFaultIndex = categoryTotals.findIndex((count) => count === maxFault)
  const topFaultType = maxFaultIndex >= 0 ? data.categories[maxFaultIndex] : 'نامشخص'

  const chartColors = data.series.map((series) => SEVERITY_CHART_COLORS[series.name] || DEFAULT_COLOR)

  // Chart configuration
  const chartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      fontFamily: 'inherit',
      height: 350,
      stacked: true,
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
      categories: data.categories,
      labels: {
        style: {
          fontSize: '12px',
          fontWeight: 500,
          colors: '#374151'
        },
        rotate: -45,
        rotateAlways: true,
        maxHeight: 120
      },
      axisBorder: {
        show: true,
        color: '#e5e7eb'
      },
      axisTicks: {
        show: true,
        color: '#e5e7eb'
      }
    },
    yaxis: {
      title: {
        text: 'تعداد تصادفات',
        style: {
          fontSize: '14px',
          fontWeight: 600,
          color: '#374151'
        }
      },
      labels: {
        style: {
          fontSize: '12px',
          colors: '#6b7280'
        },
        formatter: function(val: number) {
          return val.toLocaleString('fa-IR')
        }
      }
    },
    plotOptions: {
      bar: {
        columnWidth: '60%',
        borderRadius: 4,
        dataLabels: {
          total: {
            enabled: true,
            offsetY: -20,
            style: {
              fontSize: '11px',
              fontWeight: 'bold'
            }
          }
        }
      }
    },
    colors: chartColors,
    dataLabels: {
      enabled: false
    },
    grid: {
      show: true,
      borderColor: '#f3f4f6',
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
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'center',
      fontSize: '14px',
      fontWeight: 500,
      labels: {
        colors: '#374151'
      },
      markers: {
        size: 6
      },
      itemMargin: {
        horizontal: 12,
        vertical: 4
      }
    },
    tooltip: {
      enabled: true,
      theme: 'light',
      style: {
        fontSize: '14px'
      },
      y: {
        formatter: function(val: number) {
          const percentage = totalFaults > 0 ? ((val / totalFaults) * 100).toFixed(1) : '0'
          return `${val.toLocaleString('fa-IR')} مورد (${percentage}%)`
        }
      }
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: {
            height: 300
          },
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
      },
      {
        breakpoint: 640,
        options: {
          chart: {
            height: 280
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    ]
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">عامل وسیله نقلیه مؤثر در تصادف</h3>
        <p className="text-sm text-gray-600">
          توزیع انواع عوامل فنی وسیله نقلیه در تصادفات به تفکیک شدت
        </p>
      </div>

      {/* Severity Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {data.series.map((series) => (
          <div key={series.name} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${SEVERITY_DOT_COLORS[series.name] || 'bg-blue-500'}`}></div>
            <span className="text-sm text-gray-700">{series.name}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="h-80 mb-6">
        {isClient && (
          <Chart
            options={chartOptions}
            series={data.series}
            type="bar"
            height="100%"
          />
        )}
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">مجموع عوامل</p>
              <p className="text-2xl font-bold text-blue-600">
                {totalFaults.toLocaleString('fa-IR')}
              </p>
              <p className="text-sm text-blue-700">در {data.categories.length} دسته</p>
            </div>
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          </div>
        </div>

        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-800">بیشترین مورد</p>
              <p className="text-2xl font-bold text-amber-600">
                {maxFault.toLocaleString('fa-IR')}
              </p>
              <p className="text-sm text-amber-700 truncate" title={topFaultType}>
                {topFaultType}
              </p>
            </div>
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">میانگین</p>
              <p className="text-2xl font-bold text-green-600">
                {data.categories.length > 0 ? Math.round(totalFaults / data.categories.length).toLocaleString('fa-IR') : '0'}
              </p>
              <p className="text-sm text-green-700">در هر دسته</p>
            </div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="mt-6">
        <h4 className="text-md font-semibold text-gray-900 mb-3">جزئیات عوامل</h4>
        <div className="space-y-2">
          {data.categories.map((category, index) => {
            const categoryTotal = categoryTotals[index]
            const categoryPercentage = totalFaults > 0 ? ((categoryTotal / totalFaults) * 100).toFixed(1) : '0'

            return (
              <div key={index} className="py-2 px-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 flex-1 truncate" title={category}>
                    {category}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {categoryTotal.toLocaleString('fa-IR')}
                  </span>
                  <span className="text-sm text-gray-500 w-16 text-left">
                    {categoryPercentage}%
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-2">
                  {data.series.map((series) => {
                    const count = series.data[index] || 0
                    const percentage = categoryTotal > 0 ? ((count / categoryTotal) * 100).toFixed(1) : '0'

                    return (
                      <div key={series.name} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${SEVERITY_DOT_COLORS[series.name] || 'bg-blue-500'}`}></div>
                        <span className="text-xs text-gray-600">{series.name}:</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {count.toLocaleString('fa-IR')}
                        </span>
                        <span className="text-xs text-gray-500">({percentage}%)</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default VehicleReasonBarChart
