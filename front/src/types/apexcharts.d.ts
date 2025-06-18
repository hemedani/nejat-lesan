declare module 'react-apexcharts' {
  import { Component } from 'react'
  import { ApexOptions } from 'apexcharts'

  interface Props {
    type?:
      | 'line'
      | 'area'
      | 'bar'
      | 'pie'
      | 'donut'
      | 'radialBar'
      | 'scatter'
      | 'bubble'
      | 'heatmap'
      | 'candlestick'
      | 'boxPlot'
      | 'radar'
      | 'polarArea'
      | 'rangeBar'
      | 'rangeArea'
      | 'treemap'
    series: ApexAxisChartSeries | ApexNonAxisChartSeries
    width?: string | number
    height?: string | number
    options?: ApexOptions
  }

  export default class Chart extends Component<Props> {}
}

declare module 'apexcharts' {
  export interface ApexChart {
    type?:
      | 'line'
      | 'area'
      | 'bar'
      | 'pie'
      | 'donut'
      | 'radialBar'
      | 'scatter'
      | 'bubble'
      | 'heatmap'
      | 'candlestick'
      | 'boxPlot'
      | 'radar'
      | 'polarArea'
      | 'rangeBar'
      | 'rangeArea'
      | 'treemap'
    height?: string | number
    width?: string | number
    fontFamily?: string
    toolbar?: {
      show?: boolean
      offsetX?: number
      offsetY?: number
      tools?: {
        download?: boolean
        selection?: boolean
        zoom?: boolean
        zoomin?: boolean
        zoomout?: boolean
        pan?: boolean
        reset?: boolean
      }
    }
  }

  export interface ApexAxisChartSeries {
    name?: string
    type?: string
    data: (number | null)[] | { x: any; y: any }[]
  }

  export interface ApexNonAxisChartSeries extends Array<number> {}

  export interface ApexOptions {
    chart?: ApexChart
    colors?: string[]
    dataLabels?: {
      enabled?: boolean
      style?: {
        fontSize?: string
        colors?: string[]
      }
      offsetX?: number
      offsetY?: number
    }
    fill?: {
      type?: string
      gradient?: {
        shadeIntensity?: number
        opacityFrom?: number
        opacityTo?: number
      }
    }
    labels?: string[]
    legend?: {
      show?: boolean
      position?: 'top' | 'right' | 'bottom' | 'left'
      horizontalAlign?: 'left' | 'center' | 'right'
    }
    plotOptions?: {
      bar?: {
        horizontal?: boolean
        borderRadius?: number
        columnWidth?: string
        dataLabels?: {
          position?: string
        }
      }
      pie?: {
        donut?: {
          size?: string
        }
      }
      heatmap?: {
        shadeIntensity?: number
        colorScale?: {
          ranges?: Array<{
            from: number
            to: number
            name: string
            color: string
          }>
        }
      }
    }
    responsive?: Array<{
      breakpoint: number
      options: ApexOptions
    }>
    series?: ApexAxisChartSeries[] | number[]
    stroke?: {
      curve?: 'smooth' | 'straight' | 'stepline'
      width?: number | number[]
    }
    title?: {
      text?: string
      align?: 'left' | 'center' | 'right'
      style?: {
        fontSize?: string
        fontWeight?: string | number
        color?: string
      }
    }
    xaxis?: {
      categories?: string[] | number[]
      title?: {
        text?: string
      }
      labels?: {
        style?: {
          fontSize?: string
        }
      }
    }
    yaxis?: {
      title?: {
        text?: string
      }
    }
    markers?: {
      size?: number
      colors?: string[]
      strokeColors?: string
      strokeWidth?: number
    }
  }
}
