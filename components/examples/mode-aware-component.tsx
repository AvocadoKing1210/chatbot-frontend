"use client"

import * as React from "react"
import { useMode } from "@/components/providers/mode-provider"
import { Database, Code } from "lucide-react"
import { Badge } from "@/components/ui/badge"

/**
 * Example component showing how to access the current mode
 * This can be used anywhere in your app that's wrapped by ModeProvider
 */
export function ModeAwareComponent() {
  const { selectedMode, isSqlMode } = useMode()

  return (
    <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
      {isSqlMode ? (
        <Database className="h-4 w-4 text-blue-600" />
      ) : (
        <Code className="h-4 w-4 text-green-600" />
      )}
      
      <div className="flex flex-col">
        <span className="text-sm font-medium">
          Current Mode: {selectedMode.toUpperCase()}
        </span>
        <Badge variant={isSqlMode ? "default" : "secondary"}>
          {isSqlMode ? "SQL Queries" : "Python Scripts"}
        </Badge>
      </div>
    </div>
  )
}

/**
 * Another example showing conditional rendering based on mode
 */
export function ConditionalContent() {
  const { isSqlMode, isPythonMode } = useMode()

  return (
    <div className="space-y-2">
      {isSqlMode && (
        <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded text-sm">
          💡 SQL Mode: I can help you write queries, optimize performance, and analyze data
        </div>
      )}
      
      {isPythonMode && (
        <div className="p-2 bg-green-50 dark:bg-green-950 rounded text-sm">
          🐍 Python Mode: I can help you write scripts, debug code, and automate tasks
        </div>
      )}
    </div>
  )
}
