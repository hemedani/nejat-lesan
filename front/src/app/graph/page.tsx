'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { ApexOptions } from 'apexcharts'

// Dynamic import to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

// TypeScript interfaces
interface MonthlyData {
  month: string
  accidents: number
  deaths: number
  injuries: number
}

interface ProvinceData {
  province: string
  count: number
}

interface TypeData {
  type: string
  count: number
}

interface WeatherData {
  condition: string
  count: number
}

interface RoadConditionData {
  condition: string
  count: number
}

interface TimeOfDayData {
  time: string
  count: number
}

interface AccidentData {
  monthlyData: MonthlyData[]
  provinceData: ProvinceData[]
  typeData: TypeData[]
  weatherData: WeatherData[]
  roadConditionData: RoadConditionData[]
  timeOfDayData: TimeOfDayData[]
}

// Mock data generator - replace with actual API calls
const generateMockAccidentData = (): AccidentData => {
  const provinces = ['تهران', 'اصفهان', 'فارس', 'خراسان رضوی', 'آذربایجان شرقی', 'خوزستان']
  const accidentTypes = ['برخورد', 'واژگونی', 'سقوط', 'آتش‌سوزی', 'سایر']
  const months = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']

  return {
    monthlyData: months.map((month) => ({
      month,
      accidents: Math.floor(Math.random() * 100) + 50,
      deaths: Math.floor(Math.random() * 20) + 5,
      injuries: Math.floor(Math.random() * 80) + 20
    })),
    provinceData: provinces.map(province => ({
      province,
      count: Math.floor(Math.random() * 200) + 50
    })),
    typeData: accidentTypes.map(type => ({
      type,
      count: Math.floor(Math.random() * 150) + 30
    })),
    weatherData: [
      { condition: 'آفتابی', count: Math.floor(Math.random() * 100) + 80 },
      { condition: 'ابری', count: Math.floor(Math.random() * 80) + 40 },
      { condition: 'بارانی', count: Math.floor(Math.random() * 60) + 30 },
      { condition: 'برفی', count: Math.floor(Math.random() * 40) + 10 },
      { condition: 'مه‌آلود', count: Math.floor(Math.random() * 30) + 15 }
    ],
    roadConditionData: [
      { condition: 'خشک', count: Math.floor(Math.random() * 120) + 100 },
      { condition: 'مرطوب', count: Math.floor(Math.random() * 80) + 50 },
      { condition: 'یخ‌زده', count: Math.floor(Math.random() * 40) + 20 },
      { condition: 'گل‌آلود', count: Math.floor(Math.random() * 30) + 15 }
    ],
    timeOfDayData: [
      { time: '6-9', count: Math.floor(Math.random() * 60) + 40 },
      { time: '9-12', count: Math.floor(Math.random() * 50) + 30 },
      { time: '12-15', count: Math.floor(Math.random() * 70) + 45 },
      { time: '15-18', count: Math.floor(Math.random() * 80) + 60 },
      { time: '18-21', count: Math.floor(Math.random() * 90) + 70 },
      { time: '21-24', count: Math.floor(Math.random() * 70) + 50 },
      { time: '0-3', count: Math.floor(Math.random() * 40) + 20 },
      { time: '3-6', count: Math.floor(Math.random() * 30) + 15 }
    ]
  }
}

const AccidentGraphsPage = () => {
  const [data, setData] = useState<AccidentData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setData(generateMockAccidentData())
      setLoading(false)
    }, 1000)
  }, [])

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">در حال بارگذاری داده‌ها...</div>
      </div>
    )
  }

  // Chart configurations
  const monthlyTrendOptions: ApexOptions = {
    chart: {
      type: 'area',
      height: 350,
      toolbar: { show: false },
      fontFamily: 'inherit'
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    xaxis: {
      categories: data.monthlyData.map((item: MonthlyData) => item.month),
      labels: { style: { fontSize: '12px' } }
    },
    yaxis: {
      title: { text: 'تعداد حوادث' }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3
      }
    },
    colors: ['#3B82F6', '#EF4444', '#F59E0B'],
    title: {
      text: 'روند ماهانه حوادث',
      align: 'center',
      style: { fontSize: '18px', fontWeight: 'bold' }
    }
  }

  const monthlyTrendSeries = [
    {
      name: 'تعداد حوادث',
      data: data.monthlyData.map((item: MonthlyData) => item.accidents)
    },
    {
      name: 'تعداد فوتی‌ها',
      data: data.monthlyData.map((item: MonthlyData) => item.deaths)
    },
    {
      name: 'تعداد مصدومین',
      data: data.monthlyData.map((item: MonthlyData) => item.injuries)
    }
  ]

  const provinceBarOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 400,
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        dataLabels: { position: 'top' }
      }
    },
    dataLabels: {
      enabled: true,
      offsetX: 30,
      style: { fontSize: '12px', colors: ['#fff'] }
    },
    xaxis: {
      categories: data.provinceData.map((item: ProvinceData) => item.province)
    },
    colors: ['#10B981'],
    title: {
      text: 'حوادث بر اساس استان',
      align: 'center',
      style: { fontSize: '18px', fontWeight: 'bold' }
    }
  }

  const provinceBarSeries = [{
    name: 'تعداد حوادث',
    data: data.provinceData.map((item: ProvinceData) => item.count)
  }]

  const accidentTypePieOptions: ApexOptions = {
    chart: {
      type: 'pie',
      height: 350
    },
    labels: data.typeData.map((item: TypeData) => item.type),
    colors: ['#8B5CF6', '#F59E0B', '#EF4444', '#10B981', '#6B7280'],
    legend: {
      position: 'bottom'
    },
    title: {
      text: 'انواع حوادث',
      align: 'center',
      style: { fontSize: '18px', fontWeight: 'bold' }
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: { width: 200 },
        legend: { position: 'bottom' }
      }
    }]
  }

  const accidentTypePieSeries = data.typeData.map((item: TypeData) => item.count)

  const weatherDonutOptions: ApexOptions = {
    chart: {
      type: 'donut',
      height: 350
    },
    labels: data.weatherData.map((item: WeatherData) => item.condition),
    colors: ['#F59E0B', '#6B7280', '#3B82F6', '#E5E7EB', '#9CA3AF'],
    plotOptions: {
      pie: {
        donut: {
          size: '65%'
        }
      }
    },
    legend: {
      position: 'right'
    },
    title: {
      text: 'حوادث بر اساس وضعیت آب‌وهوا',
      align: 'center',
      style: { fontSize: '18px', fontWeight: 'bold' }
    }
  }

  const weatherDonutSeries = data.weatherData.map((item: WeatherData) => item.count)

  const roadConditionRadarOptions: ApexOptions = {
    chart: {
      type: 'radar',
      height: 350
    },
    xaxis: {
      categories: data.roadConditionData.map((item: RoadConditionData) => item.condition)
    },
    colors: ['#EF4444'],
    title: {
      text: 'حوادث بر اساس وضعیت جاده',
      align: 'center',
      style: { fontSize: '18px', fontWeight: 'bold' }
    },
    markers: {
      size: 6,
      colors: ['#EF4444'],
      strokeColors: '#fff',
      strokeWidth: 2
    }
  }

  const roadConditionRadarSeries = [{
    name: 'تعداد حوادث',
    data: data.roadConditionData.map((item: RoadConditionData) => item.count)
  }]

  const timeOfDayColumnOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '60%'
      }
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '12px',
        colors: ['#fff']
      }
    },
    xaxis: {
      categories: data.timeOfDayData.map((item: TimeOfDayData) => item.time),
      title: { text: 'ساعت روز' }
    },
    yaxis: {
      title: { text: 'تعداد حوادث' }
    },
    colors: ['#8B5CF6'],
    title: {
      text: 'حوادث بر اساس ساعت روز',
      align: 'center',
      style: { fontSize: '18px', fontWeight: 'bold' }
    }
  }

  const timeOfDayColumnSeries = [{
    name: 'تعداد حوادث',
    data: data.timeOfDayData.map((item: TimeOfDayData) => item.count)
  }]

  const heatmapOptions: ApexOptions = {
    chart: {
      type: 'heatmap',
      height: 350
    },
    plotOptions: {
      heatmap: {
        shadeIntensity: 0.5,
        colorScale: {
          ranges: [
            { from: 0, to: 20, name: 'کم', color: '#A7F3D0' },
            { from: 21, to: 50, name: 'متوسط', color: '#34D399' },
            { from: 51, to: 80, name: 'زیاد', color: '#F59E0B' },
            { from: 81, to: 100, name: 'خیلی زیاد', color: '#EF4444' }
          ]
        }
      }
    },
    title: {
      text: 'نقشه حرارتی حوادث (استان/ماه)',
      align: 'center',
      style: { fontSize: '18px', fontWeight: 'bold' }
    },
    xaxis: {
      categories: data.monthlyData.slice(0, 6).map((item: MonthlyData) => item.month)
    }
  }

  const heatmapSeries = data.provinceData.slice(0, 6).map((province: ProvinceData) => ({
    name: province.province,
    data: data.monthlyData.slice(0, 6).map(() => Math.floor(Math.random() * 100))
  }))

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            داشبورد تحلیل حوادث
          </h1>
          <p className="text-gray-600">
            نمایش آماری و تحلیلی حوادث ترافیکی با استفاده از نمودارهای تعاملی
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">کل حوادث</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.monthlyData.reduce((sum: number, item: MonthlyData) => sum + item.accidents, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">کل فوتی‌ها</p>
                <p className="text-2xl font-bold text-red-600">
                  {data.monthlyData.reduce((sum: number, item: MonthlyData) => sum + item.deaths, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">کل مصدومین</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {data.monthlyData.reduce((sum: number, item: MonthlyData) => sum + item.injuries, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2L3 7v11a2 2 0 002 2h4v-6h2v6h4a2 2 0 002-2V7l-7-5z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">میانگین ماهانه</p>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round(data.monthlyData.reduce((sum: number, item: MonthlyData) => sum + item.accidents, 0) / data.monthlyData.length).toLocaleString()}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884zM18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trend Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <Chart
              options={monthlyTrendOptions}
              series={monthlyTrendSeries}
              type="area"
              height={350}
            />
          </div>

          {/* Province Bar Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <Chart
              options={provinceBarOptions}
              series={provinceBarSeries}
              type="bar"
              height={400}
            />
          </div>

          {/* Accident Type Pie Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <Chart
              options={accidentTypePieOptions}
              series={accidentTypePieSeries}
              type="pie"
              height={350}
            />
          </div>

          {/* Weather Donut Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <Chart
              options={weatherDonutOptions}
              series={weatherDonutSeries}
              type="donut"
              height={350}
            />
          </div>

          {/* Road Condition Radar Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <Chart
              options={roadConditionRadarOptions}
              series={roadConditionRadarSeries}
              type="radar"
              height={350}
            />
          </div>

          {/* Time of Day Column Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <Chart
              options={timeOfDayColumnOptions}
              series={timeOfDayColumnSeries}
              type="bar"
              height={350}
            />
          </div>
        </div>

        {/* Full Width Heatmap */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <Chart
            options={heatmapOptions}
            series={heatmapSeries}
            type="heatmap"
            height={350}
          />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>داده‌های نمایش داده شده نمونه بوده و برای اهداف نمایشی استفاده شده‌اند</p>
        </div>
      </div>
    </div>
  )
}

export default AccidentGraphsPage
