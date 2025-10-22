"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { BarChart3, LineChart, PieChart, Table, TrendingUp, Activity } from "lucide-react"
import { DataTableColumn } from "./data-table"

export type ChartType = "bar" | "line" | "pie" | "table" | "area" | "scatter"

export type ChartConfig = {
  type: ChartType
  title: string
  xAxis: string
  yAxis: string
  colorBy?: string
}

export type ChartCreationModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  columns: DataTableColumn[]
  rows: Array<Record<string, unknown>>
  onChartCreate: (config: ChartConfig) => void
}

const chartTypes = [
  { value: "bar", label: "Bar Chart", icon: BarChart3 },
  { value: "line", label: "Line Chart", icon: LineChart },
  { value: "pie", label: "Pie Chart", icon: PieChart },
  { value: "table", label: "Table", icon: Table },
  { value: "area", label: "Area Chart", icon: TrendingUp },
  { value: "scatter", label: "Scatter Plot", icon: Activity },
] as const

export function ChartCreationModal({ 
  open, 
  onOpenChange, 
  columns, 
  rows, 
  onChartCreate 
}: ChartCreationModalProps) {
  const [chartType, setChartType] = React.useState<ChartType>("bar")
  const [title, setTitle] = React.useState("")
  const [xAxis, setXAxis] = React.useState("")
  const [yAxis, setYAxis] = React.useState("")
  const [colorBy, setColorBy] = React.useState("none")

  // Auto-populate fields when modal opens
  React.useEffect(() => {
    if (open && columns.length > 0) {
      // Set default title
      if (!title) {
        setTitle(`Chart from ${columns.length} columns`)
      }
      
      // Set default x-axis (first column)
      if (!xAxis && columns[0]) {
        setXAxis(columns[0].name)
      }
      
      // Set default y-axis (first numeric column, or second column)
      if (!yAxis) {
        const numericColumn = columns.find(col => 
          col.type.toLowerCase().includes('numeric') || 
          col.type.toLowerCase().includes('int') ||
          col.type.toLowerCase().includes('float') ||
          col.type.toLowerCase().includes('decimal')
        )
        if (numericColumn) {
          setYAxis(numericColumn.name)
        } else if (columns[1]) {
          setYAxis(columns[1].name)
        }
      }
    }
  }, [open, columns, title, xAxis, yAxis])

  const handleCreate = () => {
    if (!chartType || !title || !xAxis) {
      return
    }

    const config: ChartConfig = {
      type: chartType,
      title,
      xAxis,
      yAxis: yAxis || xAxis,
      colorBy: colorBy && colorBy !== "none" ? colorBy : undefined,
    }

    onChartCreate(config)
    onOpenChange(false)
    
    // Reset form
    setTitle("")
    setXAxis("")
    setYAxis("")
    setColorBy("none")
  }

  const numericColumns = columns.filter(col => 
    col.type.toLowerCase().includes('numeric') || 
    col.type.toLowerCase().includes('int') ||
    col.type.toLowerCase().includes('float') ||
    col.type.toLowerCase().includes('decimal')
  )

  const categoricalColumns = columns.filter(col => 
    !col.type.toLowerCase().includes('numeric') && 
    !col.type.toLowerCase().includes('int') &&
    !col.type.toLowerCase().includes('float') &&
    !col.type.toLowerCase().includes('decimal')
  )

  const selectedChartType = chartTypes.find(ct => ct.value === chartType)
  const IconComponent = selectedChartType?.icon || BarChart3

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconComponent className="h-5 w-5" />
            Create Interactive Chart
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Chart Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="chart-type">Chart Type</Label>
            <Select value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {chartTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Chart Title */}
          <div className="space-y-2">
            <Label htmlFor="chart-title">Chart Title</Label>
            <Input
              id="chart-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter chart title"
            />
          </div>

          {/* X-Axis Selection */}
          <div className="space-y-2">
            <Label htmlFor="x-axis">X-Axis</Label>
            <Select value={xAxis} onValueChange={setXAxis}>
              <SelectTrigger>
                <SelectValue placeholder="Select X-axis column" />
              </SelectTrigger>
              <SelectContent>
                {columns.map((col) => (
                  <SelectItem key={col.name} value={col.name}>
                    <div className="flex items-center gap-2">
                      <span>{col.name}</span>
                      <span className="text-xs text-muted-foreground">({col.type})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Y-Axis Selection (for charts that need it) */}
          {chartType !== "pie" && chartType !== "table" && (
            <div className="space-y-2">
              <Label htmlFor="y-axis">Y-Axis</Label>
              <Select value={yAxis} onValueChange={setYAxis}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Y-axis column" />
                </SelectTrigger>
                <SelectContent>
                  {numericColumns.map((col) => (
                    <SelectItem key={col.name} value={col.name}>
                      <div className="flex items-center gap-2">
                        <span>{col.name}</span>
                        <span className="text-xs text-muted-foreground">({col.type})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Color By Selection (optional) */}
          {chartType !== "table" && categoricalColumns.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="color-by">Color By (Optional)</Label>
              <Select value={colorBy} onValueChange={setColorBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Select column for color grouping" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {categoricalColumns.map((col) => (
                    <SelectItem key={col.name} value={col.name}>
                      <div className="flex items-center gap-2">
                        <span>{col.name}</span>
                        <span className="text-xs text-muted-foreground">({col.type})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Data Preview */}
          <div className="space-y-2">
            <Label>Data Preview</Label>
            <div className="rounded-md border p-3 text-sm text-muted-foreground">
              <div>Rows: {rows.length}</div>
              <div>Columns: {columns.length}</div>
              {numericColumns.length > 0 && (
                <div>Numeric columns: {numericColumns.map(col => col.name).join(", ")}</div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreate}
            disabled={!chartType || !title || !xAxis}
          >
            Create Chart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
