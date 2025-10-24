"use client"

import * as React from "react"
import { CopyButton } from "@/components/ui/copy-button"

interface IsolatedCopyButtonProps {
  messageId: string
  text: string
  tooltip?: string
}

export const IsolatedCopyButton = React.memo(({ 
  text, 
  tooltip 
}: IsolatedCopyButtonProps) => {
  return (
    <CopyButton
      text={text}
      tooltip={tooltip}
    />
  )
}, (prevProps, nextProps) => {
  // Only re-render if the text content changes, not on any other state changes
  return (
    prevProps.messageId === nextProps.messageId &&
    prevProps.text === nextProps.text &&
    prevProps.tooltip === nextProps.tooltip
  )
})

IsolatedCopyButton.displayName = "IsolatedCopyButton"
