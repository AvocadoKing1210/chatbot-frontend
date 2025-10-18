"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type InlineCodeProps = React.HTMLAttributes<HTMLElement> & {
  children: React.ReactNode
}

export const InlineCode = React.forwardRef<HTMLElement, InlineCodeProps>(
  ({ children, className, ...props }, ref) => {
    const [copied, setCopied] = React.useState(false)
    const [content, setContent] = React.useState("")

    // Process content to extract text and strip backticks
    React.useEffect(() => {
      if (typeof children === "string") {
        setContent(children.replace(/^`|`$/g, ""))
      } else {
        setContent(String(children))
      }
    }, [children])

    // URL detection for special handling
    const isUrl = React.useMemo(() => {
      return typeof content === "string" &&
        (content.startsWith("http://") ||
         content.startsWith("https://") ||
         content.startsWith("www.") ||
         content.includes(".com") ||
         content.includes(".dev") ||
         content.includes(".net") ||
         content.includes(".org"))
    }, [content])

    const handleCopy = React.useCallback(async () => {
      try {
        await navigator.clipboard.writeText(content)
        setCopied(true)
        setTimeout(() => setCopied(false), 1200)
      } catch (err) {
        console.error("Failed to copy:", err)
      }
    }, [content])

    const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        handleCopy()
      }
    }, [handleCopy])

    return (
      <span
        ref={ref}
        className={cn(
          "relative mr-1 cursor-pointer rounded px-1.5 py-0.5 align-baseline font-mono text-[0.85em] border border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700",
          isUrl && "break-all",
          className
        )}
        onClick={handleCopy}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        title={`Click to copy: ${content}`}
        aria-label={`Copy ${content} to clipboard`}
        aria-live="polite"
        {...props}
      >
        {content}
        {copied && (
          <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded-md bg-slate-800 px-2 py-0.5 text-xs whitespace-nowrap text-white shadow-md dark:bg-slate-600">
            Copied!
          </span>
        )}
      </span>
    )
  }
)

InlineCode.displayName = "InlineCode"
