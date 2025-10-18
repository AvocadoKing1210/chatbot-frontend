"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface InitialMessageAreaProps {
  onStartChat?: (message: string) => void
  className?: string
  children?: React.ReactNode
}

export function InitialMessageArea({ onStartChat, className, children }: InitialMessageAreaProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center h-full px-4", className)}>
      <div className="text-center space-y-8 max-w-2xl w-full">
        {/* Title */}
        <h1 className="font-heading text-pretty text-center font-semibold tracking-tighter text-foreground sm:text-[32px] md:text-[46px] text-[29px]">
          Ask me anything about your data
        </h1>
        <h2 className="-mt-4 -mb-4 text-center text-[clamp(12px,3.5vw,20px)] sm:text-[20px] text-muted-foreground pb-12 whitespace-nowrap sm:whitespace-normal leading-tight tracking-tight">
          I'll convert your questions into SQL or Python and create visualizations automatically.
        </h2>
        
        {/* Input Component */}
        {children}
      </div>
    </div>
  )
}
