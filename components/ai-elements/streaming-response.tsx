"use client"

import * as React from "react"
import { Response } from "./response"
import { useChat } from "@/components/providers/chat-provider"
import { cn } from "@/lib/utils"

interface StreamingResponseProps {
  content: string
  isStreaming?: boolean
  className?: string
  onStreamComplete?: () => void
  shouldStop?: boolean
}

export function StreamingResponse({ 
  content, 
  isStreaming = false, 
  className,
  onStreamComplete,
  shouldStop = false
}: StreamingResponseProps) {
  const { currentChat } = useChat()
  const [displayedContent, setDisplayedContent] = React.useState("")
  const [isComplete, setIsComplete] = React.useState(false)
  const intervalRef = React.useRef<number | null>(null)
  const onCompleteRef = React.useRef<(() => void) | undefined>(undefined)

  // Keep the latest callback in a ref to avoid restarting the stream on re-renders
  React.useEffect(() => {
    onCompleteRef.current = onStreamComplete
  }, [onStreamComplete])

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

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    intervalRef.current = window.setInterval(() => {
      if (currentIndex < tokens.length) {
        setDisplayedContent(prev => prev + tokens[currentIndex])
        currentIndex++
      } else {
        setIsComplete(true)
        onCompleteRef.current?.()
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    }, 50) // Adjust speed as needed

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [content, isStreaming])

  // Handle external stop signal
  React.useEffect(() => {
    if (isStreaming && !isComplete && shouldStop) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setIsComplete(true)
      onCompleteRef.current?.()
    }
  }, [shouldStop, isStreaming, isComplete])

  // If not streaming, show content immediately
  if (!isStreaming) {
    return (
      <div className={cn("relative text-sm", className)}>
        <Response chartEnabled={!!currentChat?.chartEnabled}>
          {content}
        </Response>
      </div>
    )
  }

  return (
    <div className={cn("relative text-sm", className)}>
      <Response chartEnabled={!!currentChat?.chartEnabled}>
        {displayedContent + (!isComplete ? "▋" : "")}
      </Response>
    </div>
  )
}
