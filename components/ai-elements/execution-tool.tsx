"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "./tool"
import { DataTable, type DataTableColumn } from "./data-table"
import { cn } from "@/lib/utils"
import { Play, Repeat, Download, BarChart3 } from "lucide-react"
import { mockQueryExecutionResponse } from "@/data"
import { ChartCreationModal, ChartConfig } from "./chart-creation-modal"
import { ChartDisplay } from "./chart-display"
//

type ExecutionState = "idle" | "running" | "success" | "error"

export type ExecutionToolProps = React.HTMLAttributes<HTMLDivElement> & {
  mode: "sql" | "python"
  code: string
  autoRun?: boolean
  onSuccess?: (queryId?: number) => void
  onComplete?: () => void
}

type StoredExecution = {
  id: number
  mode: "sql" | "python"
  codeHash: string
  code: string
  columns: DataTableColumn[]
  rows: Array<Record<string, unknown>>
  meta: { full: boolean; effectiveLimit: number; wasClamped: boolean }
  createdAt: string
}

const HISTORY_KEY = "exec_history_v1"

function hashCode(input: string): string {
  let hash = 2166136261
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }
  return (hash >>> 0).toString(16)
}

function loadHistory(): StoredExecution[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function saveHistory(entries: StoredExecution[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(-20)))
  } catch {}
}

export function ExecutionTool({ className, mode, code, autoRun = false, onSuccess, onComplete, ...props }: ExecutionToolProps) {
  const [execState, setExecState] = React.useState<ExecutionState>("idle")
  const [execError, setExecError] = React.useState<string | undefined>()
  const [columns, setColumns] = React.useState<DataTableColumn[]>([])
  const [rows, setRows] = React.useState<Array<Record<string, unknown>>>([])
  const [meta, setMeta] = React.useState<{ full: boolean; effectiveLimit: number; wasClamped: boolean } | undefined>()
  const [queryId, setQueryId] = React.useState<number | undefined>()
  const [userOpened, setUserOpened] = React.useState<boolean>(autoRun)
  const [showChartModal, setShowChartModal] = React.useState(false)
  const [createdCharts, setCreatedCharts] = React.useState<ChartConfig[]>([])
  const codeHash = React.useMemo(() => hashCode(`${mode}:${code}`), [mode, code])

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

  const handleChartCreate = (config: ChartConfig) => {
    setCreatedCharts(prev => [...prev, config])
  }

  const handleChartDelete = (index: number) => {
    setCreatedCharts(prev => prev.filter((_, i) => i !== index))
  }

  const handleExecute = async () => {
    setUserOpened(true)
    setExecState("running")
    setExecError(undefined)
    try {
      const startedAt = performance.now()
      console.groupCollapsed(`[Execution] ${mode.toUpperCase()} run`)
      const codePreview = code.length > 120 ? `${code.slice(0, 120)}…` : code
      console.log("codeHash:", codeHash)
      console.log("codePreview:", codePreview)
      // Ensure a valid database connection is selected
      const selected = typeof window !== "undefined" ? localStorage.getItem("current_db_connection") : null
      if (!selected) {
        console.warn("[Execution] No database connection set in localStorage (key: current_db_connection)")
        throw new Error("No database connection selected. Use the chat header to add/select one.")
      }
      const conn = JSON.parse(selected)
      if (!conn?.connectionString || conn?.isValid === false) {
        console.warn("[Execution] Invalid connection object:", conn)
        throw new Error("Selected database connection is invalid. Please test it in the database menu.")
      }
      // Log sanitized connection details
      try {
        const url = new URL(conn.connectionString as string)
        if (url.password) url.password = "***"
        console.log("connection:", { name: conn.name, host: url.hostname, db: url.pathname?.slice(1), sanitized: url.toString() })
      } catch {
        console.log("connection:", { name: conn?.name, sanitized: "[unparseable]" })
      }

      // Execute real SQL query against the database
      const response = await fetch('/api/database/execute-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectionString: conn.connectionString,
          query: code
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Query execution failed')
      }

      const result = await response.json()
      setColumns(result.columns)
      setRows(result.data as Array<Record<string, unknown>>)
      setMeta(result.meta)
      setQueryId(result.query_id)
      setExecState("success")
      console.log("status:", "success")
      console.log("rows:", (result.data || []).length, "columns:", (result.columns || []).length)
      console.log("meta:", result.meta)
      console.log("queryId:", result.query_id)
      console.log("durationMs:", Math.round(performance.now() - startedAt))
      // Save history
      const history = loadHistory()
      const entry: StoredExecution = {
        id: result.query_id,
        mode,
        codeHash,
        code,
        columns: result.columns,
        rows: result.data as Array<Record<string, unknown>>,
        meta: result.meta,
        createdAt: new Date().toISOString(),
      }
      saveHistory([...history, entry])
      onSuccess?.(result.query_id)
    } catch (e) {
      setExecError((e as Error).message)
      setExecState("error")
      console.error("status:", "error", "message:", (e as Error).message)
    } finally {
      console.groupEnd()
      onComplete?.()
    }
  }

  React.useEffect(() => {
    if (autoRun && execState === "idle") {
      void handleExecute()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun])

  // Load from history (folded by default)
  React.useEffect(() => {
    if (execState !== "idle") return
    const history = loadHistory()
    const entry = history.find((h) => h.codeHash === codeHash && h.mode === mode)
    if (entry) {
      setColumns(entry.columns)
      setRows(entry.rows)
      setMeta(entry.meta)
      setQueryId(entry.id)
      setExecState("success")
      // keep folded: userOpened remains false
    }
  }, [codeHash, mode, execState])

  const toolState =
    execState === "idle"
      ? ("input-streaming" as const)
      : execState === "running"
      ? ("input-available" as const)
      : execState === "success"
      ? ("output-available" as const)
      : ("output-error" as const)

  return (
    <div className={cn("not-prose", className)} {...props}>
      <Tool defaultOpen={userOpened}>
        <ToolHeader title="Execution" type="tool-database_query" state={toolState} icon={Play} />
        <ToolContent>
          <ToolOutput
            output={
              execState === "success" ? (
                <div className="p-2">
                  <DataTable columns={columns} rows={rows} meta={meta} />
                </div>
              ) : undefined
            }
            errorText={execError}
            downloadButton={
              execState === "success" && rows.length > 0 ? (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowChartModal(true)}
                    className="h-6 w-6 p-0 hover:bg-muted/50"
                    title="Create Chart"
                  >
                    <BarChart3 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownload}
                    className="h-6 w-6 p-0 hover:bg-muted/50"
                    title="Download CSV"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              ) : undefined
            }
          />
        </ToolContent>
      </Tool>

      {/* Chart Creation Modal */}
      <ChartCreationModal
        open={showChartModal}
        onOpenChange={setShowChartModal}
        columns={columns}
        rows={rows}
        onChartCreate={handleChartCreate}
      />

      {/* Created Charts */}
      {createdCharts.length > 0 && (
        <div className="mt-4 space-y-4">
          {createdCharts.map((chart, index) => (
            <ChartDisplay
              key={`${chart.title}-${index}`}
              config={chart}
              columns={columns}
              rows={rows}
              onDelete={() => handleChartDelete(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}


