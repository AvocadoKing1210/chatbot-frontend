"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download } from "lucide-react"

export type DataTableColumn = {
  name: string
  type: string
}

export type DataTableProps = React.HTMLAttributes<HTMLDivElement> & {
  columns: DataTableColumn[]
  rows: Array<Record<string, unknown>>
  pageSizeOptions?: number[]
  defaultPageSize?: number
  meta?: { full: boolean; effectiveLimit: number; wasClamped: boolean }
  onDownload?: () => void
}

export function DataTable({
  className,
  columns,
  rows,
  pageSizeOptions = [5, 10, 20],
  defaultPageSize = 10,
  meta,
  onDownload,
  ...props
}: DataTableProps) {
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(defaultPageSize)

  const totalRows = rows.length
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentRows = rows.slice(startIndex, endIndex)

  React.useEffect(() => {
    // Reset to first page if page size changes to avoid out-of-range
    setPage(1)
  }, [pageSize])

  const handleDownload = () => {
    // Convert all rows to CSV
    const csvRows = rows.map(row => {
      return columns.map(col => {
        const value = row[col.name]
        if (value == null) return ''
        const stringValue = String(value)
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      })
    })

    // Add header row
    const headerRow = columns.map(col => col.name)
    const csvContent = [headerRow, ...csvRows]
      .map(row => row.join(','))
      .join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `query-results-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className={cn("w-full", className)} {...props}>
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
          {currentRows.map((row, rowIndex) => (
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
          {currentRows.length === 0 && (
            <tr>
              <td className="px-3 py-6 text-center text-muted-foreground" colSpan={columns.length}>
                No data
              </td>
            </tr>
          )}
        </tbody>
        </table>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 px-2 py-3 sm:flex-row">
        <div className="text-xs text-muted-foreground">
          Showing {currentRows.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, totalRows)} of {totalRows}
          {meta && (
            <span className="ml-2">
              (limit {meta.effectiveLimit}{meta.wasClamped ? ", clamped" : ""})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Rows per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => setPageSize(Number(v))}
            >
              <SelectTrigger className="h-8 w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(1)}
            >
              «
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ‹
            </Button>
            <span className="mx-2 text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              ›
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(totalPages)}
            >
              »
            </Button>
          </div>
        </div>
      </div>
    </div>
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


