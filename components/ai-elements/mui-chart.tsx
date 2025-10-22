"use client"

import * as React from "react"
import { BarChart } from '@mui/x-charts/BarChart'
import { LineChart } from '@mui/x-charts/LineChart'
import { PieChart } from '@mui/x-charts/PieChart'
import { ScatterChart } from '@mui/x-charts/ScatterChart'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart3, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon, 
  Activity,
  TrendingUp,
  Maximize2,
  Edit,
  Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChartConfig, ChartType } from "./chart-creation-modal"
import { DataTableColumn } from "./data-table"

export type MuiChartProps = {
  config: ChartConfig
  columns: DataTableColumn[]
  rows: Array<Record<string, unknown>>
  onEdit?: () => void
  onDelete?: () => void
}

const chartIcons = {
  bar: BarChart3,
  line: LineChartIcon,
  pie: PieChartIcon,
  area: TrendingUp,
  scatter: Activity,
  table: BarChart3, // Use bar chart icon for table as fallback
} as const

export function MuiChart({ config, columns, rows, onEdit, onDelete }: MuiChartProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  
  // Transform data for MUI Charts
  const chartData = React.useMemo(() => {
    if (!config.xAxis || rows.length === 0) {
      return { xLabels: [], data: [], pieData: [], scatterData: [] }
    }

    if (config.type === 'pie') {
      // For pie charts, we need label-value pairs
      const dataMap = new Map<string, number>()
      
      rows.forEach(row => {
        const label = String(row[config.xAxis] || '')
        const value = row[config.yAxis] || row[config.xAxis]
        
        if (label && value !== null && value !== undefined) {
          const numericValue = typeof value === 'number' ? value : parseFloat(String(value))
          if (!isNaN(numericValue)) {
            if (dataMap.has(label)) {
              dataMap.set(label, dataMap.get(label)! + numericValue)
            } else {
              dataMap.set(label, numericValue)
            }
          }
        }
      })

      const pieData = Array.from(dataMap.entries()).map(([label, value]) => ({
        id: label,
        label,
        value,
      }))

      return { xLabels: [], data: [], pieData, scatterData: [] }
    }

    if (config.type === 'scatter') {
      // For scatter plots, we need x-y coordinate pairs
      const scatterData = rows
        .map(row => {
          const xValue = row[config.xAxis]
          const yValue = row[config.yAxis]
          
          if (xValue !== null && xValue !== undefined && yValue !== null && yValue !== undefined) {
            const x = typeof xValue === 'number' ? xValue : parseFloat(String(xValue))
            const y = typeof yValue === 'number' ? yValue : parseFloat(String(yValue))
            
            if (!isNaN(x) && !isNaN(y)) {
              return { x, y, id: `${x}-${y}` }
            }
          }
          return null
        })
        .filter(Boolean) as Array<{ x: number; y: number; id: string }>

      return { xLabels: [], data: [], pieData: [], scatterData }
    }

    // For bar and line charts
    const dataMap = new Map<string, number>()
    
    rows.forEach(row => {
      const xValue = String(row[config.xAxis] || '')
      const yValue = row[config.yAxis]
      
      if (xValue && yValue !== null && yValue !== undefined) {
        const numericValue = typeof yValue === 'number' ? yValue : parseFloat(String(yValue))
        if (!isNaN(numericValue)) {
          if (dataMap.has(xValue)) {
            dataMap.set(xValue, dataMap.get(xValue)! + numericValue)
          } else {
            dataMap.set(xValue, numericValue)
          }
        }
      }
    })

    const xLabels = Array.from(dataMap.keys())
    const data = Array.from(dataMap.values())

    return { xLabels, data, pieData: [], scatterData: [] }
  }, [config, rows])

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const IconComponent = chartIcons[config.type] || BarChart3

  // Check if we have data to display
  const hasData = config.type === 'pie' 
    ? chartData.pieData.length > 0
    : config.type === 'scatter'
    ? chartData.scatterData.length > 0
    : chartData.xLabels.length > 0 && chartData.data.length > 0

  if (!hasData) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconComponent className="h-5 w-5" />
              <CardTitle className="text-lg">{config.title}</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {config.type.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenModal}
                className="h-8 w-8 p-0"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onEdit}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>X: {config.xAxis}</span>
              {config.yAxis && <span>Y: {config.yAxis}</span>}
              {config.colorBy && <span>Color: {config.colorBy}</span>}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
            <IconComponent className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              No data available for chart
            </p>
            <p className="text-xs text-muted-foreground/75">
              Data: {rows.length} rows, {columns.length} columns
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderChart = () => {
    const commonProps = {
      width: undefined, // Let it fill the container
      height: 400,
      margin: {
        left: 20,
        right: 20,
        top: 20,
        bottom: 60,
      },
    }

    switch (config.type) {
      case 'bar':
        return (
          <BarChart
            xAxis={[
              {
                scaleType: 'band',
                data: chartData.xLabels,
                label: config.xAxis,
              }
            ]}
            yAxis={[
              {
                label: config.yAxis,
              }
            ]}
            series={[
              {
                data: chartData.data,
                label: config.yAxis,
                color: 'hsl(var(--primary))',
              }
            ]}
            {...commonProps}
          />
        )

      case 'line':
        return (
          <LineChart
            xAxis={[
              {
                scaleType: 'band',
                data: chartData.xLabels,
                label: config.xAxis,
              }
            ]}
            yAxis={[
              {
                label: config.yAxis,
              }
            ]}
            series={[
              {
                data: chartData.data,
                label: config.yAxis,
                color: 'hsl(var(--primary))',
              }
            ]}
            {...commonProps}
          />
        )

      case 'pie':
        return (
          <PieChart
            series={[
              {
                data: chartData.pieData,
                highlightScope: { fade: 'global', highlight: 'item' },
              }
            ]}
            width={400}
            height={400}
          />
        )

      case 'scatter':
        return (
          <ScatterChart
            xAxis={[
              {
                label: config.xAxis,
              }
            ]}
            yAxis={[
              {
                label: config.yAxis,
              }
            ]}
            series={[
              {
                data: chartData.scatterData,
                label: `${config.xAxis} vs ${config.yAxis}`,
                color: 'hsl(var(--primary))',
              }
            ]}
            {...commonProps}
          />
        )

      default:
        return (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            Chart type "{config.type}" not supported yet
          </div>
        )
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconComponent className="h-5 w-5" />
            <CardTitle className="text-lg">{config.title}</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {config.type.toUpperCase()}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenModal}
              className="h-8 w-8 p-0"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>X: {config.xAxis}</span>
            {config.yAxis && <span>Y: {config.yAxis}</span>}
            {config.colorBy && <span>Color: {config.colorBy}</span>}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="w-full h-[400px] flex items-center justify-center">
          {renderChart()}
        </div>
        
        <div className="mt-4 text-xs text-muted-foreground/75">
          <p>
            Data points: {
              config.type === 'pie' 
                ? chartData.pieData.length
                : config.type === 'scatter'
                ? chartData.scatterData.length
                : chartData.data.length
            }
          </p>
          <p>Total rows processed: {rows.length}</p>
        </div>
      </CardContent>
      
      {/* Chart Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconComponent className="h-5 w-5" />
              {config.title}
            </DialogTitle>
          </DialogHeader>
          <div className="w-full h-[600px] flex items-center justify-center">
            {renderChart()}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
