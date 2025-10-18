"use client"

import * as React from "react"
import { Response } from "./response"
import { cn } from "@/lib/utils"

interface StreamingResponseProps {
  content: string
  isStreaming?: boolean
  className?: string
  onStreamComplete?: () => void
}

export function StreamingResponse({ 
  content, 
  isStreaming = false, 
  className,
  onStreamComplete 
}: StreamingResponseProps) {
  const [displayedContent, setDisplayedContent] = React.useState("")
  const [isComplete, setIsComplete] = React.useState(false)

  // Handle streaming logic
  React.useEffect(() => {
    if (!isStreaming) {
      // For existing messages, show immediately without streaming
      setDisplayedContent(content)
      setIsComplete(true)
      return
    }

    // For new messages that should stream, start the streaming effect
    setDisplayedContent("")
    setIsComplete(false)
    
    // Split content into tokens (words and punctuation)
    const tokens = content.split(/(\s+|[.,!?;:])/).filter(token => token.length > 0)
    let currentIndex = 0

    // If no tokens, show content immediately
    if (tokens.length === 0) {
      setDisplayedContent(content)
      setIsComplete(true)
      onStreamComplete?.()
      return
    }

    const streamInterval = setInterval(() => {
      if (currentIndex < tokens.length) {
        setDisplayedContent(prev => prev + tokens[currentIndex])
        currentIndex++
      } else {
        setIsComplete(true)
        onStreamComplete?.()
        clearInterval(streamInterval)
      }
    }, 50) // Adjust speed as needed

    return () => clearInterval(streamInterval)
  }, [content, isStreaming, onStreamComplete])

  // If not streaming, show content immediately
  if (!isStreaming) {
    return (
      <div className={cn("relative whitespace-pre-wrap text-sm", className)}>
        <Response>
          {content}
        </Response>
      </div>
    )
  }

  return (
    <div className={cn("relative whitespace-pre-wrap text-sm", className)}>
      <Response>
        {displayedContent + (!isComplete ? "▋" : "")}
      </Response>
    </div>
  )
}
