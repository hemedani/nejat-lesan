'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { ApexOptions } from 'apexcharts'

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface VehicleReasonPieChartProps {
  data: Array<{
    name: string
    count: number
  }> | null
  isLoading: boolean
}

const VehicleReasonPieChart: React.FC<VehicleReasonPieChartProps> = ({
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
  if (!data || data.length === 0) {
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">سهم وسایل نقلیه با/بدون عامل</h3>
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

  // Prepare chart data
  const chartData = data.map(item => item.count)
  const chartLabels = data.map(item => item.name)
  const totalCount = data.reduce((sum, item) => sum + item.count, 0)

  // Chart configuration
  const chartOptions: ApexOptions = {
    chart: {
      type: 'donut',
      fontFamily: 'inherit',
      height: 350,
      toolbar: {
        show: false
      }
    },

    series: chartData,
    labels: chartLabels,
    colors: ['#ef4444', '#22c55e'], // Red for 'با عامل', Green for 'بدون عامل'
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '14px',
        fontWeight: 'bold',
        colors: ['#ffffff']
      },
      formatter: function(val: number) {
        return val.toFixed(1) + '%'
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '60%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#374151',
              offsetY: -10
            },
            value: {
              show: true,
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#111827',
              offsetY: 10,
              formatter: function(val: string) {
                return parseInt(val).toLocaleString('fa-IR')
              }
            },
            total: {
              show: true,
              showAlways: true,
              label: 'مجموع',
              fontSize: '14px',
              fontWeight: 'normal',
              color: '#6b7280',
              formatter: function() {
                return totalCount.toLocaleString('fa-IR')
              }
            }
          }
        }
      }
    },
    legend: {
      show: true,
      position: 'bottom',
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
        horizontal: 16,
        vertical: 8
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
          const percentage = ((val / totalCount) * 100).toFixed(1)
          return `${val.toLocaleString('fa-IR')} (${percentage}%)`
        }
      }
    },
    responsive: [
      {
        breakpoint: 640,
        options: {
          chart: {
            height: 280
          },
          plotOptions: {
            pie: {
              donut: {
                size: '50%'
              }
            }
          }
        }
      }
    ]
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">سهم وسایل نقلیه با/بدون عامل</h3>
        <p className="text-sm text-gray-600">
          توزیع وسایل نقلیه بر اساس وجود یا عدم وجود عامل مؤثر در تصادف
        </p>
      </div>

      {/* Chart */}
      <div className="h-80">
        {isClient && (
          <Chart
            options={chartOptions}
            series={chartData}
            type="donut"
            height="100%"
          />
        )}
      </div>

      {/* Statistics */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {data.map((item, index) => {
          const percentage = ((item.count / totalCount) * 100).toFixed(1)
          const isWithFault = item.name === 'با عامل'

          return (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 ${
                isWithFault
                  ? 'bg-red-50 border-red-200'
                  : 'bg-green-50 border-green-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${
                    isWithFault ? 'text-red-800' : 'text-green-800'
                  }`}>
                    {item.name}
                  </p>
                  <p className={`text-2xl font-bold ${
                    isWithFault ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {item.count.toLocaleString('fa-IR')}
                  </p>
                  <p className={`text-sm ${
                    isWithFault ? 'text-red-700' : 'text-green-700'
                  }`}>
                    {percentage}% از کل
                  </p>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  isWithFault ? 'bg-red-500' : 'bg-green-500'
                }`}></div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default VehicleReasonPieChart
