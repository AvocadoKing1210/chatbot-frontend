"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Tool, ToolContent, ToolHeader, ToolOutput } from "./tool"
import { ChartEmbed } from "./chart-embed"
import { BarChart3, LineChart } from "lucide-react"
import { mockChartGenerationResponse } from "@/data"

type ChartState = "idle" | "running" | "success" | "error"

export type ChartToolProps = React.HTMLAttributes<HTMLDivElement> & {
  autoRun?: boolean
}

export function ChartTool({ autoRun = false, ...props }: ChartToolProps) {
  const [state, setState] = React.useState<ChartState>("idle")
  const [error, setError] = React.useState<string | undefined>()
  const [embedUrl, setEmbedUrl] = React.useState<string | undefined>()

  const run = async () => {
    setState("running")
    setError(undefined)
    try {
      await new Promise((r) => setTimeout(r, 300))
      const res = mockChartGenerationResponse
      if (res.status !== "ok" || !res.embed_url) throw new Error(res.errorText || "Chart failed")
      setEmbedUrl(res.embed_url)
      setState("success")
    } catch (e) {
      setError((e as Error).message)
      setState("error")
    }
  }

  React.useEffect(() => {
    if (autoRun && state === "idle") void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun])

  const toolState =
    state === "idle"
      ? ("input-streaming" as const)
      : state === "running"
      ? ("input-available" as const)
      : state === "success"
      ? ("output-available" as const)
      : ("output-error" as const)

  return (
    <Tool defaultOpen={state !== "idle"} {...props}>
      <ToolHeader title="Chart" type="tool-chart_generation" state={toolState} icon={LineChart} />
      <ToolContent>
        <ToolOutput output={state === "success" && embedUrl ? <ChartEmbed embedUrl={embedUrl} /> : undefined} errorText={error} />
      </ToolContent>
    </Tool>
  )
}


