"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { BarChart3, LineChart, PieChart, Table, TrendingUp, Activity } from "lucide-react"
import { DataTableColumn } from "./data-table"
import { BarChart } from '@mui/x-charts/BarChart'

export type ChartType = "bar" | "line" | "pie" | "table" | "area" | "scatter"

export type BarChartType = "basic" | "multi-series" | "stacked" | "grouped"

export type BarChartOptions = {
  type: BarChartType
  layout?: "vertical" | "horizontal"
  categoryGapRatio?: number
  barGapRatio?: number
  barLabel?: "none" | "value"
  showLegend?: boolean
  showGrid?: boolean
  skipAnimation?: boolean
  // Multi-series specific
  series?: Array<{
    column: string
    label?: string
    color?: string
  }>
  // Stacked specific
  stackGroups?: Array<{
    name: string
    series: string[]
  }>
  stackOffset?: "none" | "expand" | "wiggle" | "silhouette"
  stackOrder?: "none" | "ascending" | "descending" | "insideOut" | "reverse"
}

export type ChartConfig = {
  type: ChartType
  title: string
  xAxis: string
  yAxis: string
  colorBy?: string
  barOptions?: BarChartOptions
}

export type ChartCreationModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  columns: DataTableColumn[]
  rows: Array<Record<string, unknown>>
  onChartCreate?: (config: ChartConfig) => void
  // Edit mode support
  initialConfig?: ChartConfig
  onChartUpdate?: (config: ChartConfig) => void
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
  onChartCreate,
  initialConfig,
  onChartUpdate
}: ChartCreationModalProps) {
  const [chartType, setChartType] = React.useState<ChartType>(initialConfig?.type || "bar")
  const [title, setTitle] = React.useState(initialConfig?.title || "")
  const [xAxis, setXAxis] = React.useState(initialConfig?.xAxis || "")
  const [yAxis, setYAxis] = React.useState(initialConfig?.yAxis || "")
  const [colorBy, setColorBy] = React.useState(initialConfig?.colorBy || "none")
  const [barOptions, setBarOptions] = React.useState<BarChartOptions>({
    type: initialConfig?.barOptions?.type || "basic",
    layout: initialConfig?.barOptions?.layout || "vertical",
    categoryGapRatio: initialConfig?.barOptions?.categoryGapRatio ?? 0.3,
    barGapRatio: initialConfig?.barOptions?.barGapRatio ?? 0.1,
    barLabel: initialConfig?.barOptions?.barLabel || "none",
    showLegend: initialConfig?.barOptions?.showLegend ?? false,
    showGrid: initialConfig?.barOptions?.showGrid ?? true,
    skipAnimation: initialConfig?.barOptions?.skipAnimation ?? false,
    series: initialConfig?.barOptions?.series || [],
    stackGroups: initialConfig?.barOptions?.stackGroups || [],
    stackOffset: initialConfig?.barOptions?.stackOffset || "none",
    stackOrder: initialConfig?.barOptions?.stackOrder || "none",
  })

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

  const handleSave = () => {
    if (!chartType || !title || !xAxis) return

    const config: ChartConfig = {
      type: chartType,
      title,
      xAxis,
      yAxis: yAxis || xAxis,
      colorBy: colorBy && colorBy !== "none" ? colorBy : undefined,
      barOptions: chartType === 'bar' ? barOptions : undefined,
    }

    if (initialConfig && onChartUpdate) {
      onChartUpdate(config)
    } else if (onChartCreate) {
      onChartCreate(config)
    }
    onOpenChange(false)
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

  // Build preview dataset for bar chart
  const previewBar = React.useMemo(() => {
    if (!xAxis || rows.length === 0) return { labels: [], series: [] }
    
    // Get unique x-axis values
    const xValues = new Set<string>()
    rows.forEach((row) => {
      const x = String(row[xAxis] ?? '')
      if (x) xValues.add(x)
    })
    const labels = Array.from(xValues).slice(0, 15)
    
    // Handle different bar chart types
    if (chartType === 'bar' && barOptions.type === 'multi-series' && barOptions.series && barOptions.series.length > 0) {
      // Multi-series: build data for each series
      const series = barOptions.series.map(s => {
        const values = labels.map(label => {
          const row = rows.find(r => String(r[xAxis] ?? '') === label)
          if (!row) return 0
          const val = row[s.column]
          if (val == null) return 0
          const num = typeof val === 'number' ? val : parseFloat(String(val))
          return isNaN(num) ? 0 : num
        })
        return {
          data: values,
          label: s.label || s.column
        }
      })
      return { labels, series }
    } else if (chartType === 'bar' && barOptions.type === 'stacked' && barOptions.stackGroups && barOptions.stackGroups.length > 0) {
      // Stacked: build data for each stack group
      const series = barOptions.stackGroups.flatMap(group => 
        group.series.map(seriesName => {
          const values = labels.map(label => {
            const row = rows.find(r => String(r[xAxis] ?? '') === label)
            if (!row) return 0
            const val = row[seriesName]
            if (val == null) return 0
            const num = typeof val === 'number' ? val : parseFloat(String(val))
            return isNaN(num) ? 0 : num
          })
          return {
            data: values,
            label: seriesName,
            stack: group.name
          }
        })
      )
      return { labels, series }
    } else {
      // Basic single series
      const map = new Map<string, number>()
      rows.forEach((row) => {
        const x = String(row[xAxis] ?? '')
        const yv = row[yAxis]
        if (!x || yv == null) return
        const num = typeof yv === 'number' ? yv : parseFloat(String(yv))
        if (isNaN(num)) return
        map.set(x, (map.get(x) || 0) + num)
      })
      const values = labels.map(label => map.get(label) || 0)
      return { labels, series: [{ data: values, label: yAxis }] }
    }
  }, [rows, xAxis, yAxis, chartType, barOptions])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] md:max-w-[1100px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconComponent className="h-5 w-5" />
            {initialConfig ? 'Edit Interactive Chart' : 'Create Interactive Chart'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col md:flex-row gap-6 py-4 h-[70vh]">
          {/* Left side - Form (scrollable) */}
          <div className="flex-1 space-y-6 overflow-y-auto pr-2">
            {/* Chart Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="chart-type" className="text-sm font-medium">Chart Type</Label>
              <Select value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
                <SelectTrigger className="w-full max-w-xs">
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

            {/* Bar Chart Type Selection */}
            {chartType === 'bar' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium block">Bar Chart Type</Label>
                <Select value={barOptions.type} onValueChange={(v: BarChartType) => setBarOptions(o => ({...o, type: v}))}>
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic (Single Series)</SelectItem>
                    <SelectItem value="multi-series">Multi-Series</SelectItem>
                    <SelectItem value="stacked">Stacked</SelectItem>
                    <SelectItem value="grouped">Grouped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Chart Title */}
            <div className="space-y-2">
              <Label htmlFor="chart-title" className="text-sm font-medium block">Chart Title</Label>
              <Input
                id="chart-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter chart title"
                className="w-full max-w-xs"
              />
            </div>

            {/* X-Axis Selection */}
            <div className="space-y-2">
              <Label htmlFor="x-axis" className="text-sm font-medium">X-Axis</Label>
              <Select value={xAxis} onValueChange={setXAxis}>
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue placeholder="Select X-axis column" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((col) => (
                    <SelectItem key={col.name} value={col.name}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="truncate">{col.name}</span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">({col.type})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Y-Axis Selection (for charts that need it, but not for multi-series bar charts) */}
            {chartType !== "pie" && chartType !== "table" && !(chartType === "bar" && barOptions.type === "multi-series") && (
              <div className="space-y-2">
                <Label htmlFor="y-axis" className="text-sm font-medium">Y-Axis</Label>
                <Select value={yAxis} onValueChange={setYAxis}>
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue placeholder="Select Y-axis column" />
                  </SelectTrigger>
                  <SelectContent>
                    {numericColumns.map((col) => (
                      <SelectItem key={col.name} value={col.name}>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="truncate">{col.name}</span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">({col.type})</span>
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
                <Label htmlFor="color-by" className="text-sm font-medium">Color By (Optional)</Label>
                <Select value={colorBy} onValueChange={setColorBy}>
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue placeholder="Select column for color grouping" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {categoricalColumns.map((col) => (
                      <SelectItem key={col.name} value={col.name}>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="truncate">{col.name}</span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">({col.type})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Bar chart advanced options */}
            {chartType === 'bar' && (
              <div className="space-y-6 pt-2">

                {/* Multi-Series Configuration */}
                {barOptions.type === 'multi-series' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Series</Label>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setBarOptions(o => ({
                          ...o, 
                          series: [...(o.series || []), { column: yAxis || numericColumns[0]?.name || '', label: '' }]
                        }))}
                      >
                        Add Series
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {(barOptions.series || []).map((s, idx) => (
                        <div key={idx} className="grid grid-cols-3 gap-2 items-center">
                          <Select value={s.column} onValueChange={(val) => setBarOptions(o => ({
                            ...o,
                            series: o.series?.map((item, i) => i === idx ? { ...item, column: val } : item) || []
                          }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {numericColumns.map((col) => (
                                <SelectItem key={col.name} value={col.name}>
                                  {col.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Label (optional)"
                            value={s.label || ''}
                            onChange={(e) => setBarOptions(o => ({
                              ...o,
                              series: o.series?.map((item, i) => i === idx ? { ...item, label: e.target.value } : item) || []
                            }))}
                          />
                          <Button 
                            variant="ghost"
                            size="sm"
                            onClick={() => setBarOptions(o => ({
                              ...o,
                              series: o.series?.filter((_, i) => i !== idx) || []
                            }))}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stacked Configuration */}
                {barOptions.type === 'stacked' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Stack Groups</Label>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setBarOptions(o => ({
                          ...o, 
                          stackGroups: [...(o.stackGroups || []), { name: `Group ${(o.stackGroups?.length || 0) + 1}`, series: [] }]
                        }))}
                      >
                        Add Group
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {(barOptions.stackGroups || []).map((group, groupIdx) => (
                        <div key={groupIdx} className="space-y-2 p-3 border rounded">
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="Group name"
                              value={group.name}
                              onChange={(e) => setBarOptions(o => ({
                                ...o,
                                stackGroups: o.stackGroups?.map((g, i) => i === groupIdx ? { ...g, name: e.target.value } : g) || []
                              }))}
                              className="flex-1"
                            />
                            <Button 
                              variant="ghost"
                              size="sm"
                              onClick={() => setBarOptions(o => ({
                                ...o,
                                stackGroups: o.stackGroups?.filter((_, i) => i !== groupIdx) || []
                              }))}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              ×
                            </Button>
                          </div>
                          <div className="space-y-1">
                            {group.series.map((seriesName, seriesIdx) => (
                              <div key={seriesIdx} className="flex items-center gap-2">
                                <Select value={seriesName} onValueChange={(val) => setBarOptions(o => ({
                                  ...o,
                                  stackGroups: o.stackGroups?.map((g, i) => i === groupIdx ? {
                                    ...g,
                                    series: g.series.map((s, j) => j === seriesIdx ? val : s)
                                  } : g) || []
                                }))}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {numericColumns.map((col) => (
                                      <SelectItem key={col.name} value={col.name}>
                                        {col.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button 
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setBarOptions(o => ({
                                    ...o,
                                    stackGroups: o.stackGroups?.map((g, i) => i === groupIdx ? {
                                      ...g,
                                      series: g.series.filter((_, j) => j !== seriesIdx)
                                    } : g) || []
                                  }))}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                >
                                  ×
                                </Button>
                              </div>
                            ))}
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setBarOptions(o => ({
                                ...o,
                                stackGroups: o.stackGroups?.map((g, i) => i === groupIdx ? {
                                  ...g,
                                  series: [...g.series, numericColumns[0]?.name || '']
                                } : g) || []
                              }))}
                            >
                              Add Series
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Stack Offset</Label>
                        <Select value={barOptions.stackOffset || 'none'} onValueChange={(v: "none" | "expand" | "wiggle" | "silhouette") => setBarOptions(o => ({...o, stackOffset: v}))}>
                          <SelectTrigger className="w-full max-w-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="expand">Expand</SelectItem>
                            <SelectItem value="wiggle">Wiggle</SelectItem>
                            <SelectItem value="silhouette">Silhouette</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Stack Order</Label>
                        <Select value={barOptions.stackOrder || 'none'} onValueChange={(v: "none" | "ascending" | "descending" | "insideOut" | "reverse") => setBarOptions(o => ({...o, stackOrder: v}))}>
                          <SelectTrigger className="w-full max-w-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="ascending">Ascending</SelectItem>
                            <SelectItem value="descending">Descending</SelectItem>
                            <SelectItem value="insideOut">Inside Out</SelectItem>
                            <SelectItem value="reverse">Reverse</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Common Options */}
                <div className="space-y-4 border-t pt-4">
                  <h4 className="text-sm font-medium text-muted-foreground">Common Options</h4>
                  
                  {/* Layout */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium block">Layout</Label>
                    <Select value={barOptions.layout} onValueChange={(v: "vertical" | "horizontal") => setBarOptions(o => ({...o, layout: v}))}>
                      <SelectTrigger className="w-full max-w-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vertical">Vertical</SelectItem>
                        <SelectItem value="horizontal">Horizontal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Bar Label */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium block">Bar Label</Label>
                    <Select value={barOptions.barLabel || 'none'} onValueChange={(v: "none" | "value") => setBarOptions(o => ({...o, barLabel: v}))}>
                      <SelectTrigger className="w-full max-w-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Hidden</SelectItem>
                        <SelectItem value="value">Value</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Category Gap */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium block">Category Gap</Label>
                    <Input 
                      type="number" 
                      step="0.05" 
                      min="0" 
                      max="1" 
                      value={barOptions.categoryGapRatio ?? 0.3} 
                      onChange={(e) => setBarOptions(o => ({...o, categoryGapRatio: Math.min(1, Math.max(0, Number(e.target.value))) }))} 
                      className="w-full max-w-xs" 
                    />
                  </div>

                  {/* Bar Gap */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium block">Bar Gap</Label>
                    <Input 
                      type="number" 
                      step="0.05" 
                      min="-1" 
                      max="1" 
                      value={barOptions.barGapRatio ?? 0.1} 
                      onChange={(e) => setBarOptions(o => ({...o, barGapRatio: Math.min(1, Math.max(-1, Number(e.target.value))) }))} 
                      className="w-full max-w-xs" 
                    />
                  </div>

                  {/* Legend */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium block">Legend</Label>
                    <Select value={(barOptions.showLegend ? 'on' : 'off') as 'on' | 'off'} onValueChange={(v: 'on' | 'off') => setBarOptions(o => ({...o, showLegend: v === 'on'}))}>
                      <SelectTrigger className="w-full max-w-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="on">On</SelectItem>
                        <SelectItem value="off">Off</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Grid */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium block">Grid</Label>
                    <Select value={(barOptions.showGrid ? 'on' : 'off') as 'on' | 'off'} onValueChange={(v: 'on' | 'off') => setBarOptions(o => ({...o, showGrid: v === 'on'}))}>
                      <SelectTrigger className="w-full max-w-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="on">On</SelectItem>
                        <SelectItem value="off">Off</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Animation */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium block">Animation</Label>
                    <Select value={(barOptions.skipAnimation ? 'off' : 'on') as 'on' | 'off'} onValueChange={(v: 'on' | 'off') => setBarOptions(o => ({...o, skipAnimation: v === 'off'}))}>
                      <SelectTrigger className="w-full max-w-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="on">On</SelectItem>
                        <SelectItem value="off">Off</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Right side - Live Preview */}
          <div className="hidden sm:block flex-1">
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="rounded-md border p-4">
                {chartType === 'bar' ? (
                  <div className="w-full h-[320px]">
                    <BarChart
                      xAxis={barOptions.layout === 'horizontal' ? undefined : [{
                        scaleType: 'band',
                        data: previewBar.labels,
                        categoryGapRatio: barOptions.categoryGapRatio,
                        barGapRatio: barOptions.barGapRatio,
                        label: xAxis,
                      }]}
                      yAxis={barOptions.layout === 'horizontal' ? [{
                        scaleType: 'band',
                        data: previewBar.labels,
                        categoryGapRatio: barOptions.categoryGapRatio,
                        barGapRatio: barOptions.barGapRatio,
                        label: xAxis,
                      }] : [{ label: yAxis }]}
                      series={previewBar.series.map((s, index) => ({
                        data: s.data,
                        label: barOptions.showLegend ? s.label : undefined,
                        stack: s.stack,
                        color: `hsl(${200 + index * 40}, 70%, 50%)`, // Different colors for each series
                      }))}
                      layout={barOptions.layout === 'horizontal' ? 'horizontal' : undefined}
                      height={300}
                      margin={{ left: 20, right: 20, top: 10, bottom: 50 }}
                      grid={barOptions.showGrid ? { vertical: true, horizontal: true } : undefined}
                      barLabel={barOptions.barLabel === 'value' ? 'value' : undefined}
                      skipAnimation={barOptions.skipAnimation}
                    />
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Select Bar to see live preview. Other chart previews will be added next.</div>
                )}
                <div className="mt-3 text-xs text-muted-foreground">
                  <div>Rows: {rows.length} · Columns: {columns.length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!chartType || !title || !xAxis}
          >
            {initialConfig ? 'Save Changes' : 'Create Chart'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
