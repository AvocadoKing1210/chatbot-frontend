"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { TypewriterText } from "./typewriter-text"

interface InitialMessageAreaProps {
  onStartChat?: (message: string) => void
  className?: string
  children?: React.ReactNode
}

export function InitialMessageArea({ onStartChat, className, children }: InitialMessageAreaProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center h-full px-4", className)}>
      <div className="text-center space-y-8 max-w-2xl w-full relative">
        {/* Irregular Grid Background - positioned closely around content */}
        <div className="absolute -inset-8 opacity-40">
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0, 0, 0, 0.15) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 0, 0, 0.15) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
              clipPath: 'polygon(0% 15%, 15% 0%, 85% 0%, 100% 20%, 100% 80%, 85% 100%, 15% 100%, 0% 85%)'
            }}
          />
        </div>
        {/* Title and Subtitle */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Ask me about your data
          </h1>
          <p className="text-sm md:text-base text-muted-foreground min-h-[1.5rem]">
            <TypewriterText
              texts={[
                "I will convert your natural language into SQL query or python script, help you execute it and create charts",
                "Ask me anything about your data and I'll generate the perfect query",
                "Transform your questions into powerful data insights with AI",
                "From simple questions to complex visualizations - I've got you covered"
              ]}
              typingSpeed={50}
              deletingSpeed={30}
              pauseTime={5000}
              className="text-muted-foreground"
            />
          </p>
        </div>
        
        {/* Input Component */}
        {children}
      </div>
    </div>
  )
}
