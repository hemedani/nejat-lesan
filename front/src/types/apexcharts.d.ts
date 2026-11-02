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
    stacked?: boolean
    /**
     * Theme hooks. Without these, a themed options object cannot be annotated as
     * `ApexOptions` — which is part of why every chart hardcoded light colours.
     * See `src/utils/chart-theme.ts`.
     */
    background?: string
    foreColor?: string
    animations?: {
      enabled?: boolean
      speed?: number
    }
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
    data: (number | null)[] | { x: string | number | Date; y: string | number | Date }[]
  }

  export type ApexNonAxisChartSeries = number[]

  export interface ApexOptions {
    chart?: ApexChart
    colors?: string[]
    /** Drives ApexCharts' own defaults (toolbar icons, selection, tooltip chrome). */
    theme?: {
      mode?: 'light' | 'dark'
      palette?: string
    }
    dataLabels?: {
      enabled?: boolean
      style?: {
        fontSize?: string
        fontWeight?: string | number
        colors?: string[]
      }
      dropShadow?: {
        enabled?: boolean
        top?: number
        left?: number
        blur?: number
        opacity?: number
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
    grid?: {
      show?: boolean
      borderColor?: string
      strokeDashArray?: number
      xaxis?: {
        lines?: {
          show?: boolean
        }
      }
      yaxis?: {
        lines?: {
          show?: boolean
        }
      }
    }
    labels?: string[]
    legend?: {
      show?: boolean
      position?: 'top' | 'right' | 'bottom' | 'left'
      horizontalAlign?: 'left' | 'center' | 'right'
      fontSize?: string
      fontWeight?: number | string
      labels?: {
        colors?: string | string[]
      }
      markers?: {
        size?: number
        strokeWidth?: number
        shape?: string
      }
      itemMargin?: {
        horizontal?: number
        vertical?: number
      }
    }
    plotOptions?: {
      bar?: {
        horizontal?: boolean
        borderRadius?: number
        columnWidth?: string
        dataLabels?: {
          position?: string
          total?: {
            enabled?: boolean
            offsetY?: number
            style?: {
              fontSize?: string
              fontWeight?: number | string
              colors?: string[]
            }
          }
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
    tooltip?: {
      enabled?: boolean
      theme?: 'dark' | 'light'
      style?: {
        fontSize?: string
        fontFamily?: string
      }
      y?: {
        formatter?: (val: number) => string
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
          colors?: string | string[]
          fontFamily?: string
        }
      }
      axisBorder?: {
        color?: string
      }
      axisTicks?: {
        color?: string
      }
    }
    yaxis?: {
      title?: {
        text?: string
      }
      labels?: {
        style?: {
          colors?: string | string[]
          fontFamily?: string
        }
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
