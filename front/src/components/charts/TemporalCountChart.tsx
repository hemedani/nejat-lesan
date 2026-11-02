'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { useChartTheme } from "@/utils/chart-theme";

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface ChartSeries {
  name: string
  data: number[]
}

interface TemporalCountData {
  categories: string[]
  series: ChartSeries[]
}

interface TemporalCountChartProps {
  data: TemporalCountData | null
  isLoading: boolean
}

const TemporalCountChart: React.FC<TemporalCountChartProps> = ({ data, isLoading }) => {
  const chartTheme = useChartTheme();
  if (isLoading) {
    return (
      <div className="bg-surface rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-surface-sunken rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-surface-sunken rounded"></div>
        </div>
      </div>
    )
  }

  if (!data || !data.series || data.series.length === 0) {
    return (
      <div className="bg-surface rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-fg mb-4">مقایسه زمانی شمار تصادفات</h3>
        <div className="flex items-center justify-center h-64 text-fg-muted">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-4 text-fg-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm">هیچ داده‌ای برای نمایش وجود ندارد</p>
            <p className="text-xs text-fg-faint mt-1">لطفاً فیلترهای مناسب را اعمال کنید</p>
          </div>
        </div>
      </div>
    )
  }

  const chartOptions = {
    chart: {
      type: 'area' as const,
      height: 400,
      fontFamily: 'inherit',
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      }
    },
    colors: chartTheme.colors,
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth' as const,
      width: 3
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 90, 100]
      }
    },
    xaxis: {
      categories: data.categories,
      title: {
        text: 'دوره زمانی',
        style: {
          fontSize: '14px',
          fontWeight: 600,
          color: chartTheme.label
        }
      },
      labels: {
        style: {
          fontSize: '12px',
          colors: chartTheme.label
        }
      }
    },
    yaxis: {
      title: {
        text: 'تعداد تصادفات',
        style: {
          fontSize: '14px',
          fontWeight: 600,
          color: chartTheme.label
        }
      },
      labels: {
        style: {
          fontSize: '12px',
          colors: chartTheme.label
        },
        formatter: (value: number) => Math.round(value).toString()
      }
    },
    grid: {
      show: true,
      borderColor: chartTheme.grid,
      strokeDashArray: 0,
      position: 'back' as const,
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
      position: 'top' as const,
      horizontalAlign: 'right' as const,
      fontSize: '14px',
      fontWeight: 500,
      labels: {
        colors: chartTheme.label
      }
    },
    tooltip: {
      theme: chartTheme.mode,
      style: {
        fontSize: '12px'
      },
      x: {
        show: true,
        format: 'dd/MM/yy'
      },
      y: {
        formatter: (value: number) => `${Math.round(value)} تصادف`
      }
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: {
            height: 300
          },
          legend: {
            position: 'bottom' as const
          }
        }
      }
    ]
  }

  // Calculate some basic statistics
  const totalAccidents = data.series.reduce((acc, series) => {
    return acc + series.data.reduce((sum, val) => sum + val, 0)
  }, 0)

  const maxValue = Math.max(...data.series.flatMap(series => series.data))
  const avgValue = totalAccidents / data.categories.length

  return (
    <div className="bg-surface rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-fg mb-2">مقایسه زمانی شمار تصادفات</h3>
        <div className="flex items-center gap-6 text-sm text-fg-muted">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-brand rounded-full"></div>
            <span>کل تصادفات: {totalAccidents.toLocaleString('fa-IR')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>میانگین: {Math.round(avgValue).toLocaleString('fa-IR')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>حداکثر: {maxValue.toLocaleString('fa-IR')}</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        <Chart
          options={chartOptions}
          series={data.series}
          type="area"
          height={400}
        />
      </div>

      {/* Footer Info */}
      <div className="mt-4 text-xs text-fg-muted text-center">
        داده‌ها بر اساس فیلترهای اعمال شده نمایش داده شده‌اند
      </div>
    </div>
  )
}

export default TemporalCountChart
