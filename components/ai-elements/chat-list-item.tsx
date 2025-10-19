"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Database, Code, BarChart3, Star } from "lucide-react"
import { ChatItem } from "@/data/chats"
import { cn } from "@/lib/utils"

interface ChatListItemProps {
  chat: ChatItem
  onClick: (chatId: string) => void
  onTogglePin?: (chatId: string) => void
  isActive?: boolean
  className?: string
}

export function ChatListItem({ chat, onClick, onTogglePin, isActive, className }: ChatListItemProps) {
  // Refs and state for single-line tag fitting
  const tagsContainerRef = React.useRef<HTMLDivElement | null>(null)
  const moreBadgeMeasureRef = React.useRef<HTMLDivElement | null>(null)
  const tagMeasureRefs = React.useRef<Record<number, HTMLDivElement | null>>({})
  const [visibleTagCount, setVisibleTagCount] = React.useState<number>(3)
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    const diffInDays = Math.floor(diffInHours / 24)
    
    if (diffInHours < 1) {
      return "Just now"
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      })
    }
  }

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'sql':
        return <Database className="h-3 w-3" />
      case 'python':
        return <Code className="h-3 w-3" />
      default:
        return <Database className="h-3 w-3" />
    }
  }

  const truncateTag = (tag: string, maxLength: number = 12) => {
    if (tag.length <= maxLength) return tag
    return tag.substring(0, maxLength) + "..."
  }

  // Recalculate how many tags fit in one line with +N
  const recalcVisibleTags = React.useCallback(() => {
    if (!chat.tags || chat.tags.length === 0) {
      setVisibleTagCount(0)
      return
    }

    const containerWidth = tagsContainerRef.current?.clientWidth || 0
    if (containerWidth === 0) return

    const gapPx = 4 // Tailwind gap-1
    const tagWidths: number[] = chat.tags.map((_, idx) => tagMeasureRefs.current[idx]?.offsetWidth || 0)
    const moreWidth = moreBadgeMeasureRef.current?.offsetWidth || 24

    // First, try to fit all tags without +N
    let totalWidth = 0
    for (let i = 0; i < tagWidths.length; i++) {
      totalWidth += (i > 0 ? gapPx : 0) + tagWidths[i]
    }

    // If all tags fit, show them all
    if (totalWidth <= containerWidth) {
      setVisibleTagCount(chat.tags.length)
      return
    }

    // Otherwise, find how many fit with +N
    let used = 0
    let count = 0
    for (let i = 0; i < tagWidths.length; i++) {
      const width = tagWidths[i]
      const addGap = count > 0 ? gapPx : 0
      const remainingAfterThis = chat.tags.length - (count + 1)
      const needsMore = remainingAfterThis > 0
      const projected = used + addGap + width + (needsMore ? gapPx + moreWidth : 0)
      if (projected <= containerWidth) {
        used = used + addGap + width
        count++
      } else {
        break
      }
    }

    setVisibleTagCount(count)
  }, [chat.tags])

  React.useEffect(() => {
    recalcVisibleTags()
  }, [recalcVisibleTags])

  React.useEffect(() => {
    const handler = () => recalcVisibleTags()
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [recalcVisibleTags])

  // Use ResizeObserver for more accurate measurements
  React.useEffect(() => {
    if (!tagsContainerRef.current) return

    const resizeObserver = new ResizeObserver(() => {
      // Small delay to ensure DOM is updated
      setTimeout(recalcVisibleTags, 0)
    })

    resizeObserver.observe(tagsContainerRef.current)
    return () => resizeObserver.disconnect()
  }, [recalcVisibleTags])

  const getModeBadges = () => {
    const badges = []
    
    // Add mode badge
    badges.push(
      <Tooltip key="mode" delayDuration={200}>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-center w-5 h-5 rounded bg-muted text-muted-foreground">
            {getModeIcon(chat.mode)}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{chat.mode.toUpperCase()}</p>
        </TooltipContent>
      </Tooltip>
    )
    
    // Add chart badge if enabled
    if (chat.chartEnabled) {
      badges.push(
        <Tooltip key="chart" delayDuration={200}>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-center w-5 h-5 rounded bg-muted text-muted-foreground">
              <BarChart3 className="h-3 w-3" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Chart</p>
          </TooltipContent>
        </Tooltip>
      )
    }
    
    return badges
  }

  const getTags = () => {
    if (!chat.tags || chat.tags.length === 0) return null
    
    const visibleTags = chat.tags.slice(0, visibleTagCount)
    const hiddenCount = Math.max(0, chat.tags.length - visibleTagCount)
    
    return (
      <div ref={tagsContainerRef} className="flex items-center gap-1 flex-nowrap overflow-hidden min-w-0">
        {visibleTags.map((tag, index) => (
          <Tooltip key={index} delayDuration={200}>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className="text-xs px-1.5 py-0.5 h-5 text-muted-foreground border-muted-foreground/20"
              >
                {truncateTag(tag)}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{tag}</p>
            </TooltipContent>
          </Tooltip>
        ))}
        {hiddenCount > 0 && (
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className="text-xs px-1.5 py-0.5 h-5 text-muted-foreground border-muted-foreground/20"
              >
                +{hiddenCount}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top">
              <div className="space-y-1">
                <p className="font-medium">Additional tags:</p>
                <div className="mt-1 space-y-1.5">
                  {chat.tags.slice(visibleTagCount).map((tag, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      <span>{tag}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
        {/* Hidden measurement elements to calculate widths */}
        <div className="absolute opacity-0 pointer-events-none -z-50">
          {chat.tags.map((tag, idx) => (
            <div
              key={`m-${idx}`}
              ref={(el) => { tagMeasureRefs.current[idx] = el }}
              className="inline-flex items-center text-xs px-1.5 py-0.5 h-5 border rounded"
            >
              {truncateTag(tag)}
            </div>
          ))}
          <div ref={moreBadgeMeasureRef} className="inline-flex items-center text-xs px-1.5 py-0.5 h-5 border rounded">+99</div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(chat.id)}
      className={cn(
        "rounded-lg p-3 text-sm hover:bg-accent cursor-pointer transition-all duration-200 group relative",
        isActive && "bg-accent",
        className
      )}
    >
      {/* Title and Date Row */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="font-medium truncate group-hover:text-foreground transition-colors flex-1 min-w-0">
          {chat.title}
        </div>
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              {formatTime(chat.updatedAt)}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{new Date(chat.updatedAt).toLocaleString()}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Description */}
      <div className="text-xs text-muted-foreground truncate mb-2">
        {chat.preview}
      </div>

      {/* Metadata Row: Mode badges, Tags */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {/* Mode badges */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {getModeBadges()}
          </div>
          
          {/* Tags */}
          <div className="flex-1 min-w-0">
            {getTags()}
          </div>
        </div>
      </div>

      {/* Unpin button positioned in bottom right corner */}
      {chat.pinned && onTogglePin && (
        <div className="absolute bottom-2 right-2">
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-destructive/10 hover:text-destructive rounded-full bg-background border border-border shadow-sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onTogglePin(chat.id)
                }}
              >
                <Star className="h-3 w-3 fill-current" />
                <span className="sr-only">Unpin chat</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Unpin chat</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </motion.div>
  )
}
