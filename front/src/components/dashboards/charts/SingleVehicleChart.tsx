'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { ApexOptions } from 'apexcharts'
import { useChartTheme } from "@/utils/chart-theme";

// Dynamic import to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

// Props interface
interface SingleVehicleChartData {
  name: string
  count: number
}

interface ChartProps {
  data: SingleVehicleChartData[]
  isLoading: boolean
}

const SingleVehicleChart: React.FC<ChartProps> = ({ data, isLoading }) => {
  const chartTheme = useChartTheme();

  // Early return for loading state
  if (isLoading) {
    return (
      <div className="bg-surface rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-fg mb-4">تصادفات تک وسیله‌ای</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
            <p className="text-fg-muted">در حال بارگذاری...</p>
          </div>
        </div>
      </div>
    )
  }

  // Early return for no data state
  if (!data || data.length === 0) {
    return (
      <div className="bg-surface rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-fg mb-4">تصادفات تک وسیله‌ای</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <svg className="w-16 h-16 text-fg-faint mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" />
            </svg>
            <h4 className="text-lg font-medium text-fg mb-2">داده‌ای موجود نیست</h4>
            <p className="text-fg-muted">اطلاعات تصادفات تک وسیله‌ای در فیلترهای انتخابی یافت نشد.</p>
          </div>
        </div>
      </div>
    )
  }

  // Sort data consistently for chart and legend color alignment
  const sortedData = [...data].sort((a, b) => b.count - a.count)
  const chartLabels = sortedData.map(item => item.name)
  const chartSeries = sortedData.map(item => item.count)
  const totalCount = chartSeries.reduce((sum, count) => sum + count, 0)

  // Doughnut chart options
  const doughnutOptions: ApexOptions = {
    chart: {
      type: 'donut',
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
          reset: false,
        },
      },
    },
    series: chartSeries,
    labels: chartLabels,
    colors: chartTheme.colors,
    legend: {
      position: 'bottom',
      fontSize: '14px',
      fontWeight: 500,
      labels: {
        colors: chartTheme.label
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
              color: chartTheme.label,
              formatter: () => totalCount.toLocaleString()
            },
            value: {
              show: true,
              fontSize: '24px',
              fontWeight: 700,
              color: chartTheme.fg,
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
        colors: [chartTheme.onFill]
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
    <div className="bg-surface rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-fg">تصادفات تک وسیله‌ای</h3>
        <div className="flex items-center gap-2 text-sm text-fg-muted">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <span>{totalCount.toLocaleString()} مورد</span>
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
        <h4 className="text-sm font-medium text-fg mb-3">جزئیات تصادفات تک وسیله‌ای</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {sortedData.map((item, index) => {
              const percentage = ((item.count / totalCount) * 100).toFixed(1)
              return (
                <div key={index} className="flex items-center justify-between py-1 px-2 rounded hover:bg-surface-hover">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: doughnutOptions.colors?.[index % (doughnutOptions.colors?.length || 8)] || '#F59E0B'
                      }}
                    ></div>
                    <span className="text-sm text-fg">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-fg">{item.count.toLocaleString()}</span>
                    <span className="text-xs text-fg-muted mr-2">({percentage}%)</span>
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}

export default SingleVehicleChart
