"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  stateKey?: string
}

export const DataTable = React.memo(function DataTable({
  className,
  columns,
  rows,
  pageSizeOptions = [5, 10, 20, 40],
  defaultPageSize = 10,
  meta,
  stateKey,
  ...props
}: DataTableProps) {
  const [pageSize, setPageSize] = React.useState(() => {
    if (!stateKey || typeof window === "undefined") return defaultPageSize
    try {
      const raw = localStorage.getItem(`dt:${stateKey}:pageSize`)
      const parsed = raw ? Number(raw) : NaN
      return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultPageSize
    } catch {
      return defaultPageSize
    }
  })
  const [page, setPage] = React.useState(() => {
    if (!stateKey || typeof window === "undefined") return 1
    try {
      const raw = localStorage.getItem(`dt:${stateKey}:page`)
      const parsed = raw ? Number(raw) : NaN
      return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1
    } catch {
      return 1
    }
  })

  const totalRows = rows.length
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentRows = rows.slice(startIndex, endIndex)

  React.useEffect(() => {
    // Reset to first page if page size changes to avoid out-of-range
    setPage(1)
  }, [pageSize])

  // Persist pagination if a stateKey is provided
  React.useEffect(() => {
    if (!stateKey || typeof window === "undefined") return
    try {
      localStorage.setItem(`dt:${stateKey}:pageSize`, String(pageSize))
    } catch {}
  }, [stateKey, pageSize])

  React.useEffect(() => {
    if (!stateKey || typeof window === "undefined") return
    try {
      // Clamp page before saving
      const clamped = Math.min(Math.max(1, page), totalPages)
      if (clamped !== page) {
        setPage(clamped)
        return
      }
      localStorage.setItem(`dt:${stateKey}:page`, String(page))
    } catch {}
  }, [stateKey, page, totalPages])

  return (
    <div className={cn("w-full flex flex-col", className)} {...props}>
      {/* Scrollable table container */}
      <div className="overflow-x-auto flex-1">
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
            {currentRows.map((row, rowIndex) => {
              const keyParts = columns.map(c => String(row[c.name] ?? '')).join('|')
              const stableKey = keyParts.length > 0 ? `${keyParts}:${rowIndex}` : String(rowIndex)
              return (
              <tr key={stableKey} className="border-b last:border-0">
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
            )})}
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

      {/* Fixed pagination controls */}
      <div className="flex flex-col items-center justify-between gap-3 px-2 py-3 sm:flex-row border-t bg-background/95 backdrop-blur-sm sticky bottom-0">
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
}, (prev, next) => {
  // Shallow referential memo; parent should keep rows/columns stable when unchanged
  return (
    prev.columns === next.columns &&
    prev.rows === next.rows &&
    prev.defaultPageSize === next.defaultPageSize &&
    prev.pageSizeOptions === next.pageSizeOptions &&
    prev.meta === next.meta &&
    prev.className === next.className
  )
})

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


