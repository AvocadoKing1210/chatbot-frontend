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
import { Play, Repeat, BarChart3, Download, CheckCircleIcon, CircleIcon, ClockIcon, XCircleIcon, ChevronDownIcon, Square, ChevronRight } from "lucide-react"
import { mockQueryExecutionResponse } from "@/data"
//

type ExecutionState = "idle" | "running" | "success" | "error"

export type ExecutionToolProps = React.HTMLAttributes<HTMLDivElement> & {
  mode: "sql" | "python"
  code: string
  shouldExecute?: boolean
  onSuccess?: (queryId?: number) => void
  onComplete?: () => void
  onStart?: () => void
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

// In-memory cache to avoid re-hydration flicker and repeated storage reads
const EXEC_RESULT_CACHE = new Map<string, StoredExecution>()
const EXEC_INFLIGHT = new Map<string, Promise<{ ok: boolean; status: number; body: any }>>()
const EXEC_ABORTS = new Map<string, AbortController>()

function getExecCacheKey(mode: "sql" | "python", codeHash: string) {
  return `${mode}:${codeHash}`
}

function getCachedExecution(mode: "sql" | "python", codeHash: string): StoredExecution | null {
  const key = getExecCacheKey(mode, codeHash)
  const cached = EXEC_RESULT_CACHE.get(key)
  if (cached) return cached
  const history = loadHistory()
  const entry = history.find((h) => h.codeHash === codeHash && h.mode === mode) || null
  if (entry) EXEC_RESULT_CACHE.set(key, entry)
  return entry
}

function setCachedExecution(entry: StoredExecution) {
  const key = getExecCacheKey(entry.mode, entry.codeHash)
  if (EXEC_RESULT_CACHE.has(key)) EXEC_RESULT_CACHE.delete(key)
  EXEC_RESULT_CACHE.set(key, entry)
  // Simple LRU eviction
  const MAX_CACHE = 50
  if (EXEC_RESULT_CACHE.size > MAX_CACHE) {
    const oldest = EXEC_RESULT_CACHE.keys().next().value as string | undefined
    if (oldest) EXEC_RESULT_CACHE.delete(oldest)
  }
}

function MeasuredResults({ cacheKey, children }: { cacheKey: string; children: React.ReactNode }) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const [minHeight, setMinHeight] = React.useState<number | undefined>(() => {
    if (typeof window === "undefined") return undefined
    try {
      const raw = localStorage.getItem(`results_h_${cacheKey}`)
      const h = raw ? Number(raw) : NaN
      return Number.isFinite(h) && h > 0 ? h : undefined
    } catch {
      return undefined
    }
  })

  React.useEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const h = Math.round(entry.contentRect.height)
        if (h > 0) {
          setMinHeight(h)
          try { localStorage.setItem(`results_h_${cacheKey}`, String(h)) } catch {}
        }
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [cacheKey])

  return (
    <div ref={containerRef} style={minHeight ? { minHeight } : undefined}>
      {children}
    </div>
  )
}

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

// Normalize a raw SQL engine error into a concise human message
function normalizeSqlErrorMessage(message: string): string {
  if (!message) return 'Unknown SQL error'
  // Common Postgres error phrasing
  if (/operator does not exist/i.test(message)) return 'Type mismatch in condition or operator'
  if (/syntax error/i.test(message)) return 'Syntax error in SQL'
  if (/relation "?.+"? does not exist/i.test(message)) return 'Table or view not found'
  if (/column "?.+"? does not exist/i.test(message)) return 'Column not found'
  if (/permission denied/i.test(message)) return 'Permission denied for this operation'
  return message
}

// Extract short + details
function parseSqlErrorMessage(message: string): { message: string; details?: string } {
  const short = normalizeSqlErrorMessage(message)
  if (short !== message) {
    return { message: short, details: message }
  }
  return { message }
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
  const codeHash = React.useMemo(() => hashCode(`${mode}:${code}`), [mode, code])
  const hydratedEntry = React.useMemo(() => getCachedExecution(mode, codeHash), [mode, codeHash])
  const [execState, setExecState] = React.useState<ExecutionState>(hydratedEntry ? "success" : "idle")
  const [execError, setExecError] = React.useState<string | undefined>()
  const [columns, setColumns] = React.useState<DataTableColumn[]>(() => hydratedEntry?.columns ?? [])
  const [rows, setRows] = React.useState<Array<Record<string, unknown>>>(() => hydratedEntry?.rows ?? [])
  const [meta, setMeta] = React.useState<{ full: boolean; effectiveLimit: number; wasClamped: boolean } | undefined>(() => hydratedEntry?.meta)
  const [queryId, setQueryId] = React.useState<number | undefined>(() => hydratedEntry?.id)
  const [errorDetails, setErrorDetails] = React.useState<string | undefined>(undefined)
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
  
  // Initial state pre-filled from in-memory cache/storage to avoid first-render flicker
  React.useEffect(() => {
    if (hydratedEntry) {
      execTrace("ExecutionTool prehydrated from cache", { codeHash, rows: hydratedEntry.rows?.length ?? 0 })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
  
  // Cache freshness (TTL)
  const CACHE_TTL_MS = 10 * 60 * 1000
  const isCacheFresh = React.useMemo(() => {
    if (!hydratedEntry) return false
    const createdAtTs = new Date(hydratedEntry.createdAt).getTime()
    return Number.isFinite(createdAtTs) && (Date.now() - createdAtTs) < CACHE_TTL_MS
  }, [hydratedEntry])

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

  const handleExecute = async (forceNew?: boolean) => {
    execTraceGroupStart(`ExecutionTool handleExecute ${codeHash}`, { mode })
    console.log(`[ExecutionTool] handleExecute called for codeHash: ${codeHash}`)
    setUserOpened(true)
    setExecState("running")
    setExecError(undefined)
    // notify start for external UI if provided
    try { (props as any)?.onStart?.() } catch {}
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

      // Execute real SQL query against the database with in-flight de-duplication (parsed once)
      const requestKey = `${mode}:${codeHash}`
      if (forceNew) {
        const prev = EXEC_ABORTS.get(requestKey)
        try { prev?.abort() } catch {}
        EXEC_ABORTS.delete(requestKey)
        EXEC_INFLIGHT.delete(requestKey)
      }
      let envelopePromise = EXEC_INFLIGHT.get(requestKey)
      if (!envelopePromise) {
        envelopePromise = (async () => {
          const controller = new AbortController()
          EXEC_ABORTS.set(requestKey, controller)
          const response = await fetch('/api/database/execute-query', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              connectionString: conn.connectionString,
              query: code
            }),
            signal: controller.signal,
          })
          let body: any = null
          try {
            body = await response.json()
          } catch {
            try {
              const text = await response.text()
              body = { message: text }
            } catch {
              body = null
            }
          }
          return { ok: response.ok, status: response.status, body }
        })()
        EXEC_INFLIGHT.set(requestKey, envelopePromise)
      }
      const envelope = await envelopePromise

      if (!envelope.ok) {
        const msg = envelope.body?.message || `Query execution failed (HTTP ${envelope.status})`
        throw new Error(msg)
      }

      const result = envelope.body
      setColumns(result.columns)
      setRows(result.data as Array<Record<string, unknown>>)
      setMeta(result.meta)
      setQueryId(result.query_id)
      setErrorDetails(undefined)
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
      setCachedExecution(entry)
      onSuccess?.(result.query_id)
    } catch (e) {
      const err = e as Error
      if ((err as any)?.name === 'AbortError') {
        setExecError('Execution cancelled')
      } else {
        const msg = (err && err.message) ? err.message : String(err)
        const { message: shortMsg, details } = parseSqlErrorMessage(msg)
        setExecError(shortMsg)
        setErrorDetails(details)
      }
      setExecState("error")
      console.error("status:", "error", "message:", err?.message)
      execTrace("ExecutionTool error", { codeHash, message: err?.message })
    } finally {
      try {
        const requestKey = `${mode}:${codeHash}`
        EXEC_INFLIGHT.delete(requestKey)
        EXEC_ABORTS.delete(requestKey)
      } catch {}
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

    if (!shouldExecute || hasExecutedRef.current) {
      // Nothing to do
      return
    }

    // If we already have a fresh cached result, prefer reusing it and skip auto-run
    if (hydratedEntry && isCacheFresh) {
      hasExecutedRef.current = true
      // Ensure state reflects cached entry (guard in case initializers didn't set)
      if (columns.length === 0 && rows.length === 0) {
        setColumns(hydratedEntry.columns)
        setRows(hydratedEntry.rows)
        setMeta(hydratedEntry.meta)
        setQueryId(hydratedEntry.id)
      }
      setExecError(undefined)
      setExecState("success")
      execTrace("ExecutionTool reused fresh cache; skipped auto-run", { codeHash })
      return
    }

    // Otherwise, perform execution once
    console.log(`[ExecutionTool] Starting query execution`)
    execTrace("ExecutionTool starting execution", { codeHash })
    hasExecutedRef.current = true
    // Safety: clear charts on re-run
    try {
      clearChartsForCodeHash(codeHash)
    } catch {}
    setCreatedCharts([])
    void handleExecute()
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
            {/* Execute / Stop / Refresh */}
            {execState === "idle" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setExecError(undefined)
                  void handleExecute()
                }}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                title="Run"
                aria-label="Run"
              >
                <Play className="h-4 w-4" />
              </Button>
            )}
            {execState === "running" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  try {
                    const requestKey = `${mode}:${codeHash}`
                    EXEC_ABORTS.get(requestKey)?.abort()
                  } catch {}
                }}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                title="Stop"
                aria-label="Stop"
              >
                <Square className="h-4 w-4" />
              </Button>
            )}
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setExecError(undefined)
                    void handleExecute()
                  }}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  title={isCacheFresh ? "Refresh" : "Refresh (cache stale)"}
                  aria-label="Refresh"
                >
                  <Repeat className="h-4 w-4" />
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
                <MeasuredResults cacheKey={`${mode}:${codeHash}`}>
                  <div className="p-2">
                    <DataTable columns={columns} rows={rows} meta={meta} stateKey={`${mode}:${codeHash}`} />
                  </div>
                </MeasuredResults>
              ) : undefined
            }
            errorText={execError}
          />
          {execState === "error" && errorDetails && (
            <div className="px-4 pb-4 text-xs text-muted-foreground">
              <details>
                <summary className="cursor-pointer inline-flex items-center gap-1"><ChevronRight className="h-3 w-3" /> Details</summary>
                <pre className="mt-2 whitespace-pre-wrap break-words">{errorDetails}</pre>
              </details>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
      
      {/* Display Created Charts */}
      {createdCharts.length > 0 && (
        <div className="mt-4 space-y-4">
          {createdCharts.map((chart) => (
            <MeasuredResults key={`wrap:${mode}:${codeHash}:${chart.id}`} cacheKey={`chart:${mode}:${codeHash}:${chart.id}`}>
              <MuiChart
                key={chart.id}
                config={chart.config}
                columns={columns}
                rows={rows}
                skipAnimation={Boolean(hydratedEntry)}
                onEdit={() => beginEditChart(chart.id)}
                onDelete={() => handleChartDelete(chart.id)}
              />
            </MeasuredResults>
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


