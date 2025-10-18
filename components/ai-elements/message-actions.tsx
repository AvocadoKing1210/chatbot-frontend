"use client"

import * as React from "react"
import { RotateCcw, ThumbsUp, ThumbsDown, Share } from "lucide-react"
import { Actions, Action } from "./actions"
import { IsolatedCopyButton } from "./isolated-copy-button"
import { cn } from "@/lib/utils"

interface MessageActionsProps {
  messageId: string
  messageContent: string
  currentFeedback: 'liked' | 'disliked' | null
  onRegenerate: (messageId: string) => void
  onFeedback: (messageId: string, feedback: 'liked' | 'disliked') => void
  onShare: (messageId: string) => void
  timestamp: string
}

export const MessageActions = React.memo(({
  messageId,
  messageContent,
  currentFeedback,
  onRegenerate,
  onFeedback,
  onShare,
  timestamp
}: MessageActionsProps) => {
  const handleRegenerateClick = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onRegenerate(messageId)
  }, [messageId, onRegenerate])
  
  const handleFeedbackClick = React.useCallback((feedback: 'liked' | 'disliked') => {
    onFeedback(messageId, feedback)
  }, [messageId, onFeedback])
  
  const handleShareClick = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onShare(messageId)
  }, [messageId, onShare])

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="mt-2 flex items-center justify-between">
      <Actions>
        <Action
          tooltip="Regenerate response"
          onClick={handleRegenerateClick}
        >
          <RotateCcw className="h-4 w-4" />
        </Action>
        <Action
          tooltip="Good response"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleFeedbackClick('liked')
          }}
          className={cn(
            currentFeedback === 'liked' && "text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
          )}
        >
          <ThumbsUp className="h-4 w-4" />
        </Action>
        <Action
          tooltip="Poor response"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleFeedbackClick('disliked')
          }}
          className={cn(
            currentFeedback === 'disliked' && "text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
          )}
        >
          <ThumbsDown className="h-4 w-4" />
        </Action>
        <IsolatedCopyButton
          messageId={messageId}
          text={messageContent}
          tooltip="Copy message"
        />
        <Action
          tooltip="Share message"
          onClick={handleShareClick}
        >
          <Share className="h-4 w-4" />
        </Action>
      </Actions>
      <div className="text-xs text-muted-foreground opacity-70">
        {formatTimestamp(timestamp)}
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Only re-render if the feedback state changes, not the entire message
  return (
    prevProps.messageId === nextProps.messageId &&
    prevProps.messageContent === nextProps.messageContent &&
    prevProps.currentFeedback === nextProps.currentFeedback &&
    prevProps.timestamp === nextProps.timestamp
  )
})

MessageActions.displayName = "MessageActions"
