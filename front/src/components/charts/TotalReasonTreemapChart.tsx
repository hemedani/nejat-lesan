'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { ApexOptions } from 'apexcharts'

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface TotalReasonData {
  name: string
  count: number
}

interface TotalReasonTreemapChartProps {
  data: TotalReasonData[] | null
  isLoading: boolean
}

const TotalReasonTreemapChart: React.FC<TotalReasonTreemapChartProps> = ({
  data,
  isLoading
}) => {
  // Transform data for ApexCharts treemap format
  const transformDataForTreemap = (apiData: TotalReasonData[]) => {
    if (!apiData || apiData.length === 0) return []

    const chartSeriesData = apiData.map(item => ({
      x: item.name,
      y: item.count
    }))

    return [{ data: chartSeriesData }]
  }

  // Chart configuration
  const chartOptions: ApexOptions = {
    chart: {
      type: 'treemap',
      height: 500,
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
      },
      fontFamily: 'inherit'
    },

    title: {
      text: 'توزیع علت تامه تصادفات در بروز تصادفات شدید',
      align: 'center',
      style: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#1f2937',
        fontFamily: 'inherit'
      },
      margin: 20
    },
    plotOptions: {
      treemap: {
        enableShades: true,
        shadeIntensity: 0.5,
        reverseNegativeShade: true,
        colorScale: {
          ranges: [
            {
              from: 0,
              to: 10,
              color: '#fef3c7'
            },
            {
              from: 11,
              to: 25,
              color: '#fcd34d'
            },
            {
              from: 26,
              to: 50,
              color: '#f59e0b'
            },
            {
              from: 51,
              to: 100,
              color: '#d97706'
            },
            {
              from: 101,
              to: 200,
              color: '#b45309'
            },
            {
              from: 201,
              to: 1000,
              color: '#92400e'
            }
          ]
        }
      }
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '12px',
        fontWeight: 'bold',
        colors: ['#000'],
        fontFamily: 'inherit'
      },
      formatter: function(text: string, op: { value: number }) {
        if (op.value < 10) return [text] // Don't show small values
        return [text, op.value.toLocaleString('fa-IR')]
      }
    },
    legend: {
      show: false
    },
    tooltip: {
      enabled: true,
      custom: function({ seriesIndex, dataPointIndex, w }) {
        const data = w.globals.initialSeries[seriesIndex].data[dataPointIndex]
        const percentage = ((data.y / w.globals.seriesTotals[0]) * 100).toFixed(1)
        return `
          <div class="bg-white p-4 rounded-lg shadow-lg border border-gray-200" dir="rtl" style="font-family: inherit;">
            <div class="font-semibold text-gray-900 mb-2 text-base">${data.x}</div>
            <div class="space-y-1">
              <div class="text-sm text-gray-600">تعداد: <span class="font-medium text-blue-600">${data.y.toLocaleString('fa-IR')}</span> مورد</div>
              <div class="text-sm text-gray-600">درصد: <span class="font-medium text-green-600">${percentage}%</span></div>
            </div>
          </div>
        `
      }
    },
    responsive: [
      {
        breakpoint: 1024,
        options: {
          chart: {
            height: 450
          },
          dataLabels: {
            style: {
              fontSize: '11px'
            }
          }
        }
      },
      {
        breakpoint: 768,
        options: {
          chart: {
            height: 400
          },
          title: {
            style: {
              fontSize: '16px'
            }
          },
          dataLabels: {
            style: {
              fontSize: '10px'
            }
          }
        }
      },
      {
        breakpoint: 480,
        options: {
          chart: {
            height: 350
          },
          title: {
            style: {
              fontSize: '14px'
            }
          },
          dataLabels: {
            enabled: false
          }
        }
      }
    ]
  }

  const series = data ? transformDataForTreemap(data) : []

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-6"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
        <div className="flex items-center justify-center mt-4">
          <svg className="w-6 h-6 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="mr-2 text-gray-600">در حال بارگذاری نمودار...</span>
        </div>
      </div>
    )
  }

  // Empty data state
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">داده‌ای یافت نشد</h3>
          <p className="text-gray-600">
            برای مشاهده نمودار توزیع علت تامه تصادفات، لطفاً فیلترهای مناسب را اعمال کنید.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-600">
              {data.length.toLocaleString('fa-IR')} علت برتر شناسایی شده
            </span>
          </div>
          <div className="text-sm text-gray-500">
            مجموع: {data.reduce((sum, item) => sum + item.count, 0).toLocaleString('fa-IR')} مورد
          </div>
        </div>
        <div className="text-xs text-gray-500">
          اندازه هر مربع متناسب با تعداد وقایع آن علت می‌باشد
        </div>
      </div>

      <div className="w-full">
        <Chart
          options={chartOptions}
          series={series}
          type="treemap"
          height={500}
        />
      </div>

      {/* Legend and Statistics */}
      <div className="mt-6 space-y-4">
        {/* Top 3 Causes */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-3">سه علت برتر:</h4>
          <div className="space-y-2">
            {data.slice(0, 3).map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'
                  }`}>
                    {(index + 1).toLocaleString('fa-IR')}
                  </div>
                  <span className="text-sm text-blue-900">{item.name}</span>
                </div>
                <span className="text-sm font-medium text-blue-700">
                  {item.count.toLocaleString('fa-IR')} مورد
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Color Legend */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-800 mb-3">راهنمای رنگ‌ها بر اساس تعداد:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm border border-gray-200" style={{ backgroundColor: '#fef3c7' }}></div>
              <span>۱-۱۰ مورد</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm border border-gray-200" style={{ backgroundColor: '#fcd34d' }}></div>
              <span>۱۱-۲۵ مورد</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm border border-gray-200" style={{ backgroundColor: '#f59e0b' }}></div>
              <span>۲۶-۵۰ مورد</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm border border-gray-200" style={{ backgroundColor: '#d97706' }}></div>
              <span>۵۱-۱۰۰ مورد</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm border border-gray-200" style={{ backgroundColor: '#b45309' }}></div>
              <span>۱۰۱-۲۰۰ مورد</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm border border-gray-200" style={{ backgroundColor: '#92400e' }}></div>
              <span>۲۰۱+ مورد</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TotalReasonTreemapChart
