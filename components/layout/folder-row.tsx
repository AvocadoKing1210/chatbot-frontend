"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  Folder, 
  ChevronRight, 
  ChevronDown, 
  Edit, 
  Trash2, 
  MessageSquare,
  FolderOpen
} from "lucide-react"
import { FolderItem, ChatItem } from "@/data"
import { cn } from "@/lib/utils"
import { AnimatedChatList } from "@/components/ai-elements/animated-chat-list"

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
  // Animation props
  animatingChats?: Set<string>
  onAnimationComplete?: (chatId: string, animationType: string) => void
  animatingFolders?: Set<string>
  onFolderAnimationComplete?: (folderId: string, animationType: string) => void
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
  className,
  animatingChats = new Set(),
  onAnimationComplete,
  animatingFolders = new Set(),
  onFolderAnimationComplete
}: FolderRowProps) {
  
  // Get chats that belong to this folder
  const folderChats = chats.filter(chat => folder.chatIds.includes(chat.id))
  
  // Check if this folder is currently animating
  const isDeleting = animatingFolders.has(`${folder.id}-delete`)
  const isAdding = animatingFolders.has(`${folder.id}-add`)
  
  // Handle animation completion
  React.useEffect(() => {
    if (isDeleting && onFolderAnimationComplete) {
      const timer = setTimeout(() => {
        onFolderAnimationComplete(folder.id, 'delete')
      }, 200) // Match the animation duration
      
      return () => clearTimeout(timer)
    }
  }, [isDeleting, folder.id, onFolderAnimationComplete])
  
  React.useEffect(() => {
    if (isAdding && onFolderAnimationComplete) {
      const timer = setTimeout(() => {
        onFolderAnimationComplete(folder.id, 'add')
      }, 200) // Match the animation duration
      
      return () => clearTimeout(timer)
    }
  }, [isAdding, folder.id, onFolderAnimationComplete])
  

  return (
    <div className={cn("space-y-1", className)}>
      {/* Folder Header */}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onToggle}
            animate={isDeleting ? { 
              opacity: 0, 
              scale: 0.95, 
              x: -20,
              transition: { duration: 0.2, ease: "easeInOut" }
            } : isAdding ? {
              opacity: [0, 1],
              scale: [0.95, 1],
              x: [20, 0],
              transition: { duration: 0.2, ease: "easeOut" }
            } : {}}
            className={cn(
              "flex items-center justify-between rounded-lg p-2 text-sm hover:bg-accent cursor-pointer transition-all duration-200 group relative",
              isCollapsed && "justify-center",
              isDeleting && "pointer-events-none"
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
              <AnimatedChatList
                chats={folderChats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())}
                onChatClick={onChatClick}
                onTogglePin={onTogglePin}
                onDelete={onDeleteChat}
                onMoveToFolder={onMoveChatToFolder}
                animatingChats={animatingChats}
                onAnimationComplete={onAnimationComplete}
                folders={folders}
                className="space-y-1"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
