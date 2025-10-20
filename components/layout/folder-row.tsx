"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  Folder, 
  ChevronRight, 
  ChevronDown, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  MessageSquare,
  FolderOpen,
  Star
} from "lucide-react"
import { FolderItem, ChatItem } from "@/data"
import { cn } from "@/lib/utils"

interface FolderRowProps {
  folder: FolderItem
  folders: FolderItem[]
  chats: ChatItem[]
  isExpanded: boolean
  onToggle: () => void
  onEdit: (folder: FolderItem) => void
  onDelete: (folderId: string) => void
  onChatClick: (chatId: string) => void
  onMoveChatToFolder?: (chatId: string, folderId?: string) => void
  onTogglePin?: (chatId: string) => void
  onDeleteChat?: (chatId: string) => void
  isCollapsed?: boolean
  className?: string
}

export function FolderRow({
  folder,
  folders,
  chats,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onChatClick,
  onMoveChatToFolder,
  onTogglePin,
  onDeleteChat,
  isCollapsed = false,
  className
}: FolderRowProps) {
  const [isHovered, setIsHovered] = React.useState(false)
  
  // Get chats that belong to this folder
  const folderChats = chats.filter(chat => folder.chatIds.includes(chat.id))
  
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

  return (
    <div className={cn("space-y-1", className)}>
      {/* Folder Header */}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            onClick={onToggle}
            className={cn(
              "flex items-center justify-between rounded-lg p-2 text-sm hover:bg-accent cursor-pointer transition-all duration-200 group relative",
              isCollapsed && "justify-center"
            )}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {!isCollapsed && (
                <>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isExpanded ? (
                      <FolderOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="truncate font-medium cursor-help">{folder.name}</span>
                      </TooltipTrigger>
                      {folder.description && (
                        <TooltipContent side="right" className="max-w-xs">
                          <p className="text-sm">{folder.description}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </div>
                  
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5 h-5 flex-shrink-0">
                    {folderChats.length}
                  </Badge>
                </>
              )}
            </div>

            {/* Actions button - only show on hover */}
            <AnimatePresence>
              {isHovered && !isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1"
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit(folder)
                        }}
                      >
                        <Edit className="h-3 w-3" />
                        <span className="sr-only">Edit folder</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>Edit folder</p>
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-56">
          <ContextMenuItem onClick={() => onEdit(folder)}>
            <Edit className="mr-2 h-4 w-4" /> Edit folder
          </ContextMenuItem>
          
          <ContextMenuSeparator />
          
          <ContextMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete(folder.id)}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete folder
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Folder Chats */}
      <AnimatePresence>
        {isExpanded && !isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="ml-6 space-y-1"
          >
            {folderChats.length === 0 ? (
              <div className="rounded-lg border border-dashed border-muted-foreground/25 p-3 text-center text-xs text-muted-foreground">
                <MessageSquare className="h-4 w-4 mx-auto mb-1" />
                No chats in this folder yet.
              </div>
            ) : (
              folderChats
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                .map((chat) => (
                  <ContextMenu key={chat.id}>
                    <ContextMenuTrigger asChild>
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => onChatClick(chat.id)}
                        className="flex items-center justify-between rounded-lg p-2 text-sm hover:bg-accent cursor-pointer transition-all duration-200 group"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{chat.title}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {chat.preview}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </ContextMenuTrigger>

                    <ContextMenuContent className="w-56">
                      {onTogglePin && (
                        <ContextMenuItem
                          onSelect={(e: Event) => {
                            e.preventDefault()
                            onTogglePin(chat.id)
                          }}
                        >
                          {chat.pinned ? (
                            <>
                              <Star className="mr-2 h-4 w-4 fill-current" /> Unpin
                            </>
                          ) : (
                            <>
                              <Star className="mr-2 h-4 w-4" /> Pin
                            </>
                          )}
                        </ContextMenuItem>
                      )}

                      <ContextMenuSub>
                        <ContextMenuSubTrigger>
                          <Folder className="mr-2 h-4 w-4" /> Move to folder
                        </ContextMenuSubTrigger>
                        <ContextMenuSubContent className="w-56">
                          {onMoveChatToFolder && (
                            <>
                              {folders.map((f) => {
                                const isCurrentFolder = chat.folderId === f.id
                                return (
                                  <ContextMenuItem
                                    key={f.id}
                                    disabled={isCurrentFolder}
                                    onSelect={(e: Event) => {
                                      e.preventDefault()
                                      if (!isCurrentFolder) {
                                        onMoveChatToFolder(chat.id, f.id)
                                      }
                                    }}
                                    className={isCurrentFolder ? "opacity-50 cursor-not-allowed" : ""}
                                  >
                                    <div className="flex items-center gap-2">
                                      {isCurrentFolder && (
                                        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                                      )}
                                      <span>{f.name}</span>
                                      {isCurrentFolder && (
                                        <span className="text-xs text-muted-foreground ml-auto">(current)</span>
                                      )}
                                    </div>
                                  </ContextMenuItem>
                                )
                              })}
                              <ContextMenuSeparator />
                              <ContextMenuItem
                                onSelect={(e: Event) => {
                                  e.preventDefault()
                                  onMoveChatToFolder(chat.id, undefined)
                                }}
                              >
                                Remove from folder
                              </ContextMenuItem>
                            </>
                          )}
                        </ContextMenuSubContent>
                      </ContextMenuSub>

                      {onDeleteChat && (
                        <>
                          <ContextMenuSeparator />
                          <ContextMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={(e: Event) => {
                              e.preventDefault()
                              onDeleteChat(chat.id)
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </ContextMenuItem>
                        </>
                      )}
                    </ContextMenuContent>
                  </ContextMenu>
                ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
