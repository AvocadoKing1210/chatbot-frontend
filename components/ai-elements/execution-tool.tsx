"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "./tool"
import { DataTable, type DataTableColumn } from "./data-table"
import { cn } from "@/lib/utils"
import { Play, Repeat } from "lucide-react"
import { mockQueryExecutionResponse } from "@/data"

type ExecutionState = "idle" | "running" | "success" | "error"

export type ExecutionToolProps = React.HTMLAttributes<HTMLDivElement> & {
  mode: "sql" | "python"
  code: string
  autoRun?: boolean
  onSuccess?: (queryId?: number) => void
}

export function ExecutionTool({ className, mode, code, autoRun = false, onSuccess, ...props }: ExecutionToolProps) {
  const [execState, setExecState] = React.useState<ExecutionState>("idle")
  const [execError, setExecError] = React.useState<string | undefined>()
  const [columns, setColumns] = React.useState<DataTableColumn[]>([])
  const [rows, setRows] = React.useState<Array<Record<string, unknown>>>([])
  const [meta, setMeta] = React.useState<{ full: boolean; effectiveLimit: number; wasClamped: boolean } | undefined>()
  const [queryId, setQueryId] = React.useState<number | undefined>()

  const handleExecute = async () => {
    setExecState("running")
    setExecError(undefined)
    try {
      // Simulate latency and use mock data
      await new Promise((r) => setTimeout(r, 400))
      const result = mockQueryExecutionResponse
      setColumns(result.columns)
      setRows(result.data as Array<Record<string, unknown>>)
      setMeta(result.meta)
      setQueryId(result.query_id)
      setExecState("success")
      onSuccess?.(result.query_id)
    } catch (e) {
      setExecError((e as Error).message)
      setExecState("error")
    }
  }

  React.useEffect(() => {
    if (autoRun && execState === "idle") {
      void handleExecute()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun])

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
      <Tool defaultOpen={execState !== "idle"}>
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
          />
        </ToolContent>
      </Tool>
    </div>
  )
}


