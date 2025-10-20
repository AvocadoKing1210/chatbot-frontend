import * as React from "react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  }

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-primary border-t-transparent",
        sizeClasses[size],
        className
      )}
    />
  )
}

interface LoadingStateProps {
  title?: string
  description?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingState({ 
  title = "Loading...", 
  description, 
  size = "md",
  className 
}: LoadingStateProps) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <LoadingSpinner size={size} />
        </div>
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  )
}
