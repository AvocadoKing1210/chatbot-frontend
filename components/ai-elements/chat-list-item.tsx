"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { ChatItem } from "@/data/chats"
import { cn } from "@/lib/utils"

interface ChatListItemProps {
  chat: ChatItem
  onClick: (chatId: string) => void
  isActive?: boolean
  className?: string
}

export function ChatListItem({ chat, onClick, isActive, className }: ChatListItemProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return "Just now"
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(chat.id)}
      className={cn(
        "rounded-lg p-3 text-sm hover:bg-accent cursor-pointer transition-all duration-200 group",
        isActive && "bg-accent",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate group-hover:text-foreground transition-colors">
            {chat.title}
          </div>
          <div className="text-xs text-muted-foreground truncate mt-1">
            {chat.preview}
          </div>
          
          {/* Tags */}
          {chat.tags && chat.tags.length > 0 && (
            <div className="flex gap-1 mt-2">
              {chat.tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                  {tag}
                </Badge>
              ))}
              {chat.tags.length > 2 && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  +{chat.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <div className="text-xs text-muted-foreground">
            {formatTime(chat.updatedAt)}
          </div>
          <div className="flex gap-1">
            <Badge variant="secondary" className="text-xs px-1 py-0">
              {chat.mode.toUpperCase()}
            </Badge>
            {chat.chartEnabled && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                Chart
              </Badge>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
