"use client"

import * as React from "react"
import { BarChart } from '@mui/x-charts/BarChart'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Maximize2, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChartConfig } from "./chart-creation-modal"
import { DataTableColumn } from "./data-table"

export type MuiBarChartProps = {
  config: ChartConfig
  columns: DataTableColumn[]
  rows: Array<Record<string, unknown>>
  onEdit?: () => void
  onDelete?: () => void
}

export function MuiBarChart({ config, columns, rows, onEdit, onDelete }: MuiBarChartProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  
  // Transform data for MUI BarChart
  const chartData = React.useMemo(() => {
    if (!config.xAxis || !config.yAxis || rows.length === 0) {
      return { xLabels: [], data: [] }
    }

    // Get unique x-axis values and their corresponding y-axis values
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

    // Convert to arrays for MUI BarChart
    const xLabels = Array.from(dataMap.keys())
    const data = Array.from(dataMap.values())

    return { xLabels, data }
  }, [config, rows])

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  // If no data, show placeholder
  if (chartData.xLabels.length === 0 || chartData.data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <CardTitle className="text-lg">{config.title}</CardTitle>
              <Badge variant="secondary" className="text-xs">
                BAR CHART
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
            <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/50" />
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

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <CardTitle className="text-lg">{config.title}</CardTitle>
            <Badge variant="secondary" className="text-xs">
              BAR CHART
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
        <div className="w-full h-[400px]">
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
            width={undefined} // Let it fill the container
            height={400}
            margin={{
              left: 20,
              right: 20,
              top: 20,
              bottom: 60,
            }}
          />
        </div>
        
        <div className="mt-4 text-xs text-muted-foreground/75">
          <p>Data points: {chartData.data.length}</p>
          <p>Total rows processed: {rows.length}</p>
        </div>
      </CardContent>
      
      {/* Chart Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {config.title}
            </DialogTitle>
          </DialogHeader>
          <div className="w-full h-[600px] flex items-center justify-center">
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
              width={undefined}
              height={600}
              margin={{
                left: 20,
                right: 20,
                top: 20,
                bottom: 60,
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
