"use client"

import * as React from "react"

export type AppMode = "sql" | "python"

interface ModeContextType {
  selectedMode: AppMode
  setSelectedMode: (mode: AppMode) => void
  isSqlMode: boolean
  isPythonMode: boolean
}

const ModeContext = React.createContext<ModeContextType | undefined>(undefined)

interface ModeProviderProps {
  children: React.ReactNode
  defaultMode?: AppMode
}

export function ModeProvider({ 
  children, 
  defaultMode = "sql" 
}: ModeProviderProps) {
  const [selectedMode, setSelectedMode] = React.useState<AppMode>(defaultMode)

  const isSqlMode = selectedMode === "sql"
  const isPythonMode = selectedMode === "python"

  const value = React.useMemo(
    () => ({
      selectedMode,
      setSelectedMode,
      isSqlMode,
      isPythonMode,
    }),
    [selectedMode, isSqlMode, isPythonMode]
  )

  return (
    <ModeContext.Provider value={value}>
      {children}
    </ModeContext.Provider>
  )
}

export function useMode() {
  const context = React.useContext(ModeContext)
  if (context === undefined) {
    throw new Error("useMode must be used within a ModeProvider")
  }
  return context
}

// Optional hook for components that might not always be wrapped
export function useOptionalMode() {
  return React.useContext(ModeContext)
}
