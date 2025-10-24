"use client"

import * as React from "react"
import { execTrace, execTraceGroupStart, execTraceGroupEnd, execMark } from "@/lib/trace"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tool, ToolContent, ToolInput, ToolOutput } from "./tool"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { DataTable, type DataTableColumn } from "./data-table"
import { ChartCreationModal, type ChartConfig } from "./chart-creation-modal"
import { MuiChart } from "./mui-chart"
import { cn } from "@/lib/utils"
import { Play, Repeat, BarChart3, Download, CheckCircleIcon, CircleIcon, ClockIcon, XCircleIcon, ChevronDownIcon } from "lucide-react"
import { mockQueryExecutionResponse } from "@/data"
//

type ExecutionState = "idle" | "running" | "success" | "error"

export type ExecutionToolProps = React.HTMLAttributes<HTMLDivElement> & {
  mode: "sql" | "python"
  code: string
  shouldExecute?: boolean
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

type StoredChart = {
  id: string
  codeHash: string
  config: ChartConfig
  createdAt: string
}

const HISTORY_KEY = "exec_history_v1"
const CHARTS_KEY = "exec_charts_v1"

const getStatusBadge = (status: ExecutionState) => {
  const labels = {
    "idle": "Pending",
    "running": "Running", 
    "success": "Completed",
    "error": "Error",
  } as const;

  const icons = {
    "idle": <CircleIcon className="size-4" />,
    "running": <ClockIcon className="size-4 animate-pulse" />,
    "success": <CheckCircleIcon className="size-4 text-green-600" />,
    "error": <XCircleIcon className="size-4 text-red-600" />,
  } as const;

  return (
    <Badge className="gap-1.5 rounded-full text-xs" variant="secondary">
      {icons[status]}
      {labels[status]}
    </Badge>
  );
};

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

function loadCharts(): StoredChart[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(CHARTS_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function saveCharts(entries: StoredChart[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(CHARTS_KEY, JSON.stringify(entries.slice(-50))) // Keep more charts than executions
  } catch {}
}

function clearChartsForCodeHash(codeHash: string) {
  if (typeof window === "undefined") return
  try {
    const charts = loadCharts()
    const filteredCharts = charts.filter(chart => chart.codeHash !== codeHash)
    saveCharts(filteredCharts)
  } catch {}
}

// Utility function for debugging - can be called from browser console
function getStoredChartsInfo() {
  if (typeof window === "undefined") return { total: 0, byCodeHash: {} }
  try {
    const charts = loadCharts()
    const byCodeHash = charts.reduce((acc, chart) => {
      acc[chart.codeHash] = (acc[chart.codeHash] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    return { total: charts.length, byCodeHash }
  } catch {
    return { total: 0, byCodeHash: {} }
  }
}

// Make it available globally for debugging
if (typeof window !== "undefined") {
  (window as any).getStoredChartsInfo = getStoredChartsInfo
}

export const ExecutionTool = React.memo(function ExecutionTool({ className, mode, code, shouldExecute = false, onSuccess, onComplete, ...props }: ExecutionToolProps) {
  const [execState, setExecState] = React.useState<ExecutionState>("idle")
  const [execError, setExecError] = React.useState<string | undefined>()
  const [columns, setColumns] = React.useState<DataTableColumn[]>([])
  const [rows, setRows] = React.useState<Array<Record<string, unknown>>>([])
  const [meta, setMeta] = React.useState<{ full: boolean; effectiveLimit: number; wasClamped: boolean } | undefined>()
  const [queryId, setQueryId] = React.useState<number | undefined>()
  const codeHash = React.useMemo(() => hashCode(`${mode}:${code}`), [mode, code])
  const [userOpened, setUserOpened] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return shouldExecute
    try {
      const stored = localStorage.getItem(`execOpen_${codeHash}`)
      if (stored === 'true') return true
      if (stored === 'false') return false
    } catch {}
    return shouldExecute
  })
  
  // Trace mount/unmount
  React.useEffect(() => {
    execTrace("ExecutionTool mount", { codeHash, mode })
    return () => execTrace("ExecutionTool unmount", { codeHash, mode })
  }, [codeHash, mode])

  // Persist open state
  React.useEffect(() => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(`execOpen_${codeHash}`, String(userOpened))
    } catch {}
  }, [userOpened, codeHash])

  // Persist modal state to survive component unmounting/remounting
  const [chartModalOpen, setChartModalOpen] = React.useState(() => {
    if (typeof window === "undefined") return false
    try {
      const key = `chartModalOpen_${codeHash}`
      return localStorage.getItem(key) === 'true'
    } catch {
      return false
    }
  })
  
  // Preload any prior execution synchronously to avoid flicker
  const hydrated = React.useMemo(() => {
    const history = loadHistory()
    const entry = history.find((h) => h.codeHash === codeHash && h.mode === mode)
    if (entry) {
      return {
        columns: entry.columns,
        rows: entry.rows,
        meta: entry.meta,
        queryId: entry.id,
        execState: "success" as const,
      }
    }
    return null
  }, [codeHash, mode])

  React.useEffect(() => {
    if (hydrated) {
      setColumns(hydrated.columns)
      setRows(hydrated.rows)
      setMeta(hydrated.meta)
      setQueryId(hydrated.queryId)
      setExecState("success")
      execTrace("ExecutionTool prehydrated from history", { codeHash, rows: hydrated.rows?.length ?? 0 })
    } else {
      setColumns([])
      setRows([])
      setMeta(undefined)
      setQueryId(undefined)
      setExecState("idle")
    }
    // userOpened remains false unless user executes
  }, [codeHash, mode, hydrated])

  // Store created charts (preload synchronously to avoid flicker)
  const [createdCharts, setCreatedCharts] = React.useState<Array<{ id: string; config: ChartConfig }>>(() => {
    const charts = loadCharts()
    const chartsForThisCode = charts.filter(chart => chart.codeHash === hashCode(`${mode}:${code}`))
    return chartsForThisCode.map(c => ({ id: c.id, config: c.config }))
  })
  
  // Persist editing chart state to survive component unmounting/remounting
  const [editingChart, setEditingChart] = React.useState<{ id: string; config: ChartConfig } | null>(() => {
    if (typeof window === "undefined") return null
    try {
      const key = `editingChart_${codeHash}`
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  
  // Save modal state to localStorage whenever it changes
  React.useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const key = `chartModalOpen_${codeHash}`
      localStorage.setItem(key, String(chartModalOpen))
    } catch {
      // Ignore localStorage errors
    }
  }, [chartModalOpen, codeHash])

  // Save editing chart state to localStorage whenever it changes
  React.useEffect(() => {
    if (typeof window === "undefined") return
    try {
      if (editingChart) {
        const key = `editingChart_${codeHash}`
        localStorage.setItem(key, JSON.stringify(editingChart))
      } else {
        const key = `editingChart_${codeHash}`
        localStorage.removeItem(key)
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [editingChart, codeHash])
  
  // Track if this is the initial page load (not a component re-render)
  const isInitialLoadRef = React.useRef(true)
  

  const handleDownloadCSV = React.useCallback(() => {
    if (columns.length === 0 || rows.length === 0) return

    // Create CSV content
    const headers = columns.map(col => col.name).join(',')
    const csvRows = rows.map(row => 
      columns.map(col => {
        const value = row[col.name]
        // Handle values that might contain commas or quotes
        if (value == null) return ''
        const stringValue = String(value)
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      }).join(',')
    )
    
    const csvContent = [headers, ...csvRows].join('\n')
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `query_results_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [columns, rows])

  const handleChartCreate = React.useCallback((config: ChartConfig) => {
    // Create a new chart with a unique ID
    const chartId = `chart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newChart = { id: chartId, config }
    
    setCreatedCharts(prev => [...prev, newChart])
    
    // Save to localStorage
    const storedChart: StoredChart = {
      id: chartId,
      codeHash,
      config,
      createdAt: new Date().toISOString(),
    }
    const charts = loadCharts()
    saveCharts([...charts, storedChart])
    
    console.log('Chart created with config:', config)
    console.log('Total charts stored:', charts.length + 1)
  }, [codeHash])

  const handleChartDelete = React.useCallback((chartId: string) => {
    setCreatedCharts(prev => prev.filter(chart => chart.id !== chartId))
    
    // Remove from localStorage
    const charts = loadCharts()
    const updatedCharts = charts.filter(chart => chart.id !== chartId)
    saveCharts(updatedCharts)
  }, [])

  const beginEditChart = React.useCallback((chartId: string) => {
    // First try to find in current createdCharts
    let chart = createdCharts.find(c => c.id === chartId)
    
    // If not found, try to find in localStorage
    if (!chart) {
      const charts = loadCharts()
      const storedChart = charts.find(c => c.id === chartId)
      if (storedChart) {
        chart = { id: storedChart.id, config: storedChart.config }
      }
    }
    
    if (!chart) {
      console.error(`Chart with id ${chartId} not found`)
      return
    }
    
    setEditingChart(chart)
    setChartModalOpen(true)
  }, [createdCharts])

  const handleChartUpdate = React.useCallback((updated: ChartConfig) => {
    if (!editingChart) return
    setCreatedCharts(prev => prev.map(c => c.id === editingChart.id ? { ...c, config: updated } : c))
    // persist
    const charts = loadCharts()
    const index = charts.findIndex(ch => ch.id === editingChart.id)
    if (index !== -1) {
      charts[index] = { ...charts[index], config: updated }
      saveCharts(charts)
    }
    setEditingChart(null)
  }, [editingChart])

  const handleExecute = async () => {
    execTraceGroupStart(`ExecutionTool handleExecute ${codeHash}`, { mode })
    console.log(`[ExecutionTool] handleExecute called for codeHash: ${codeHash}`)
    setUserOpened(true)
    setExecState("running")
    setExecError(undefined)
    try {
      const startedAt = performance.now()
      execMark(`exec:start:${codeHash}`)
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
      execTrace("ExecutionTool result", { codeHash, rows: (result.data || []).length, cols: (result.columns || []).length, durationMs: Math.round(performance.now() - startedAt) })
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
      execTrace("ExecutionTool error", { codeHash, message: (e as Error).message })
    } finally {
      console.groupEnd()
      onComplete?.()
      execTraceGroupEnd()
    }
  }

  // Track if we've already attempted execution to prevent re-runs
  const hasExecutedRef = React.useRef(false)

  // Reset execution flag when code changes
  React.useEffect(() => {
    hasExecutedRef.current = false
  }, [codeHash])

  // Refresh charts when code changes (synchronously from storage)
  React.useEffect(() => {
    const charts = loadCharts()
    const chartsForThisCode = charts.filter(chart => chart.codeHash === codeHash)
    setCreatedCharts(chartsForThisCode.map(c => ({ id: c.id, config: c.config })))
    execTrace("ExecutionTool codeHash changed; loaded charts", { codeHash, count: chartsForThisCode.length })
  }, [codeHash])

  // removed separate charts load effect; handled above

  // Execute query when shouldExecute is true and we haven't executed on this signal
  React.useEffect(() => {
    console.log(`[ExecutionTool] shouldExecute effect: shouldExecute=${shouldExecute}, execState=${execState}, hasExecuted=${hasExecutedRef.current}`)
    execTrace("ExecutionTool shouldExecute effect", { codeHash, shouldExecute, execState, hasExecuted: hasExecutedRef.current })

    if (shouldExecute && !hasExecutedRef.current) {
      console.log(`[ExecutionTool] Starting query execution`)
      execTrace("ExecutionTool starting execution", { codeHash })
      hasExecutedRef.current = true
      // Safety: clear charts on re-run
      try {
        clearChartsForCodeHash(codeHash)
      } catch {}
      setCreatedCharts([])
      void handleExecute()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldExecute])

  // Reset guard when signal goes low to allow subsequent runs
  React.useEffect(() => {
    if (!shouldExecute) {
      hasExecutedRef.current = false
    }
  }, [shouldExecute])

  // No post-mount history hydration; handled synchronously in state init

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
      <Collapsible open={userOpened} onOpenChange={setUserOpened} className="not-prose mb-4 w-full rounded-md border">
        <div className="group flex w-full items-center justify-between gap-4 p-3">
          <CollapsibleTrigger className="flex items-center gap-2 flex-1">
            <Play className="size-4 text-muted-foreground" />
            <span className="font-medium text-sm">Execution</span>
            {getStatusBadge(execState)}
          </CollapsibleTrigger>
          <div className="flex items-center gap-1">
            {/* Action buttons - only show when execution is successful */}
            {execState === "success" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setChartModalOpen(true)}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownloadCSV}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </>
            )}
            <CollapsibleTrigger className="p-1">
              <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
          </div>
        </div>
        
        <CollapsibleContent className="overflow-hidden transition-all duration-300 ease-in-out data-[state=closed]:max-h-0 data-[state=open]:max-h-[2000px] text-popover-foreground outline-none">
          <ToolOutput
            output={
              execState === "success" ? (
                <div className="p-2">
                  <DataTable columns={columns} rows={rows} meta={meta} />
                </div>
              ) : undefined
            }
            errorText={execError}
          />
        </CollapsibleContent>
      </Collapsible>
      
      {/* Display Created Charts */}
      {createdCharts.length > 0 && (
        <div className="mt-4 space-y-4">
          {createdCharts.map((chart) => (
            <MuiChart
              key={chart.id}
              config={chart.config}
              columns={columns}
              rows={rows}
              onEdit={() => beginEditChart(chart.id)}
              onDelete={() => handleChartDelete(chart.id)}
            />
          ))}
        </div>
      )}
      
      {/* Chart Creation Modal */}
      <ChartCreationModal
        open={chartModalOpen}
        onOpenChange={setChartModalOpen}
        columns={columns}
        rows={rows}
        onChartCreate={handleChartCreate}
        initialConfig={editingChart?.config}
        onChartUpdate={handleChartUpdate}
      />
    </div>
  )
})


