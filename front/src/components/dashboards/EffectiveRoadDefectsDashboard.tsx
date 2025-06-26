'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { ApexOptions } from 'apexcharts'

// Dynamic import to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

// Props interface for the dashboard component
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

interface DashboardProps {
  data: RoadDefectsAnalyticsData | null
  isLoading: boolean
}

const EffectiveRoadDefectsDashboard: React.FC<DashboardProps> = ({ data, isLoading }) => {
  // Early return for loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">در حال بارگذاری اطلاعات...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Early return for no data state
  if (!data) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">هیچ داده‌ای موجود نیست</h3>
              <p className="text-gray-600">برای مشاهده تحلیل، لطفاً فیلترها را اعمال کنید</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Prepare chart data from props
  const doughnutChartData = {
    series: [data.defectDistribution.withDefect, data.defectDistribution.withoutDefect],
    labels: ['دارای نقص مؤثر راه', 'فاقد نقص مؤثر راه']
  }

  // Sort defect counts data: descending order but 'سایر موارد' always last
  const sortedDefectCounts = data.defectCounts
    .filter(item => item.count > 0) // Remove zero values
    .filter(item => item.name !== 'سایر موارد')
    .sort((a, b) => b.count - a.count)

  const otherItem = data.defectCounts.find(item => item.name === 'سایر موارد')
  if (otherItem && otherItem.count > 0) {
    sortedDefectCounts.push(otherItem)
  }

  const barChartData = {
    series: [{
      name: 'تعداد تصادفات',
      data: sortedDefectCounts.map(item => item.count)
    }],
    categories: sortedDefectCounts.map(item => item.name)
  }

  // Doughnut chart options
  const doughnutOptions: ApexOptions = {
    chart: {
      type: 'donut',
      height: 350,
      fontFamily: 'inherit'
    },
    labels: doughnutChartData.labels,
    series: doughnutChartData.series,
    colors: ['#DC2626', '#059669'], // Formal red and green
    plotOptions: {
      pie: {
        donut: {
          size: '60%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'کل تصادفات',
              fontSize: '16px',
              fontWeight: 600,
              color: '#374151',
              formatter: () => (data.defectDistribution.withDefect + data.defectDistribution.withoutDefect).toString()
            }
          }
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
      style: {
        fontSize: '14px',
        fontWeight: 'bold',
        colors: ['#FFFFFF']
      }
    },
    legend: {
      position: 'bottom',
      fontSize: '14px'
    },
    tooltip: {
      y: {
        formatter: (val: number) => {
          const total = data.defectDistribution.withDefect + data.defectDistribution.withoutDefect
          const percentage = ((val / total) * 100).toFixed(1)
          return `${val} تصادف (${percentage}%)`
        }
      }
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: { width: 300 },
        legend: { position: 'bottom' }
      }
    }]
  }

  // Bar chart options
  const barOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: { show: false },
      fontFamily: 'inherit'
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '60%',
        dataLabels: {
          position: 'top'
        }
      }
    },
    dataLabels: {
      enabled: true,
      offsetY: -20,
      style: {
        fontSize: '12px',
        fontWeight: 'bold',
        colors: ['#374151']
      }
    },
    xaxis: {
      categories: barChartData.categories,
      labels: {
        style: {
          fontSize: '12px',
          colors: '#6B7280'
        },
        rotate: -45
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
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
          colors: '#6B7280'
        }
      }
    },
    colors: ['#1F2937'], // Formal dark gray
    grid: {
      borderColor: '#E5E7EB',
      strokeDashArray: 0,
      xaxis: {
        lines: { show: false }
      }
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} تصادف`
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              نقایص مؤثر راه
            </h2>
            <p className="text-gray-600">
              تحلیل نقش نقایص راه در وقوع تصادفات ترافیکی
            </p>
          </div>
          <div className="bg-blue-50 p-3 rounded-full">
            <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Doughnut Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              درصد تصادفات دارای نقص راه
            </h3>
            <p className="text-sm text-gray-600">
              نسبت تصادفات دارای نقص مؤثر راه به کل تصادفات
            </p>
          </div>
          <Chart
            options={doughnutOptions}
            series={doughnutChartData.series}
            type="donut"
            height={350}
          />
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              انواع نقایص مؤثر راه
            </h3>
            <p className="text-sm text-gray-600">
              فراوانی انواع نقایص راه در تصادفات بررسی شده
            </p>
          </div>
          <Chart
            options={barOptions}
            series={barChartData.series}
            type="bar"
            height={350}
          />
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">کل تصادفات بررسی شده</p>
              <p className="text-2xl font-bold text-gray-900">{data.defectDistribution.withDefect + data.defectDistribution.withoutDefect}</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">دارای نقص راه</p>
              <p className="text-2xl font-bold text-red-600">{data.defectDistribution.withDefect}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">فاقد نقص راه</p>
              <p className="text-2xl font-bold text-green-600">{data.defectDistribution.withoutDefect}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">شایع‌ترین نقص</p>
              <p className="text-lg font-bold text-blue-600">{data.defectCounts.length > 0 ? data.defectCounts[0].name : 'نامشخص'}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">درصد نقص راه</p>
              <p className="text-2xl font-bold text-orange-600">
                {((data.defectDistribution.withDefect / (data.defectDistribution.withDefect + data.defectDistribution.withoutDefect)) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EffectiveRoadDefectsDashboard
