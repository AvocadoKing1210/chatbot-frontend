"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  Table, 
  TrendingUp, 
  Activity,
  Download,
  ExternalLink,
  Trash2,
  Edit
} from "lucide-react"
import { ChartConfig } from "./chart-creation-modal"
import { DataTableColumn } from "./data-table"

export type ChartDisplayProps = {
  config: ChartConfig
  columns: DataTableColumn[]
  rows: Array<Record<string, unknown>>
  onEdit?: () => void
  onDelete?: () => void
}

const chartIcons = {
  bar: BarChart3,
  line: LineChart,
  pie: PieChart,
  table: Table,
  area: TrendingUp,
  scatter: Activity,
} as const

export function ChartDisplay({ config, columns, rows, onEdit, onDelete }: ChartDisplayProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const IconComponent = chartIcons[config.type]

  const handleDownload = () => {
    // Convert data to CSV for download
    const csvRows = rows.map(row => {
      return columns.map(col => {
        const value = row[col.name]
        if (value == null) return ''
        const stringValue = String(value)
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      })
    })

    const headerRow = columns.map(col => col.name)
    const csvContent = [headerRow, ...csvRows]
      .map(row => row.join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${config.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleOpenInNewWindow = () => {
    // In a real implementation, this would open a dedicated chart view
    console.log('Opening chart in new window:', config)
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
              onClick={handleDownload}
              className="h-8 w-8 p-0"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenInNewWindow}
              className="h-8 w-8 p-0"
            >
              <ExternalLink className="h-4 w-4" />
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
        {config.type === "table" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  {columns.map((col) => (
                    <th key={col.name} className="whitespace-nowrap px-3 py-2 font-medium text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span>{col.name}</span>
                        <span className="text-[10px] uppercase tracking-wider">{col.type}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, isExpanded ? rows.length : 10).map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b last:border-0">
                    {columns.map((col) => {
                      const value = row[col.name]
                      const display = formatCellValue(value, col.type)
                      return (
                        <td key={col.name} className="whitespace-nowrap px-3 py-2 align-top">
                          {display}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 10 && (
              <div className="mt-3 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? "Show Less" : `Show All ${rows.length} Rows`}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Chart placeholder - in a real implementation, this would be the actual chart */}
            <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
              <IconComponent className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                Interactive {config.type} chart would be displayed here
              </p>
              <p className="text-xs text-muted-foreground/75">
                Data: {rows.length} rows, {columns.length} columns
              </p>
              <div className="mt-4 text-xs text-muted-foreground/50">
                <p>X-Axis: {config.xAxis}</p>
                {config.yAxis && <p>Y-Axis: {config.yAxis}</p>}
                {config.colorBy && <p>Color By: {config.colorBy}</p>}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function formatCellValue(value: unknown, type: string): React.ReactNode {
  if (value == null) return <span className="text-muted-foreground">NULL</span>
  if (type.toUpperCase().includes("TIMESTAMP") || type.toUpperCase().includes("DATE")) {
    const date = new Date(String(value))
    if (!isNaN(date.getTime())) {
      return date.toLocaleString()
    }
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }
  return String(value)
}
