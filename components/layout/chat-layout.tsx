"use client"

import * as React from "react"
import { ModeProvider } from "@/components/providers/mode-provider"
import { defaultMode } from "@/data"

interface ChatLayoutProps {
  children: React.ReactNode
  className?: string
}

export function ChatLayout({ children, className }: ChatLayoutProps) {
  return (
    <ModeProvider defaultMode={defaultMode}>
      <div className={`h-full flex flex-col ${className || ''}`}>
        {children}
      </div>
    </ModeProvider>
  )
}
