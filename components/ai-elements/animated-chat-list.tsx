"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChatListItem } from "./chat-list-item"
import { ChatItem } from "@/data/chats"
import { FolderItem } from "@/data/folders"
import { cn } from "@/lib/utils"

interface AnimatedChatListProps {
  chats: ChatItem[]
  onChatClick: (chatId: string) => void
  onTogglePin?: (chatId: string) => void
  onDelete?: (chatId: string) => void
  onMoveToFolder?: (chatId: string, folderId?: string) => void
  activeChatId?: string
  className?: string
  isCollapsed?: boolean
  folders?: FolderItem[]
  // Animation states
  animatingChats?: Set<string>
  onAnimationComplete?: (chatId: string, animationType: string) => void
}

export function AnimatedChatList({
  chats,
  onChatClick,
  onTogglePin,
  onDelete,
  onMoveToFolder,
  activeChatId,
  className,
  folders = [],
  animatingChats = new Set(),
  onAnimationComplete
}: AnimatedChatListProps) {
  const [, setReorderItems] = React.useState(chats)

  // Update reorder items when chats change
  React.useEffect(() => {
    setReorderItems(chats)
  }, [chats])

  // Animation variants for different operations
  const itemVariants = {
    initial: { 
      opacity: 0, 
      y: -20, 
      scale: 0.95 
    },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30
      }
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      scale: 0.95,
      transition: {
        duration: 0.2
      }
    },
    // Pin animation - faster and simpler
    pinning: {
      scale: [1, 1.02, 1],
      transition: {
        duration: 0.2,
        ease: "easeOut" as const
      }
    },
    // Move animation
    moving: {
      scale: 0.99,
      opacity: 0.9,
      transition: {
        duration: 0.15
      }
    },
    // Delete animation
    deleting: {
      scale: [1, 1.05, 0.9],
      opacity: [1, 0.5, 0],
      x: [0, 10, -50],
      transition: {
        duration: 0.2,
        ease: "easeInOut" as const
      }
    },
    // Add animation
    adding: {
      scale: [0.9, 1.05, 1],
      opacity: [0, 1, 1],
      y: [10, -2, 0],
      transition: {
        duration: 0.3,
        ease: "easeOut" as const
      }
    }
  }

  const handleAnimationComplete = (chatId: string, animationType: string) => {
    onAnimationComplete?.(chatId, animationType)
  }

  const getAnimationVariant = (chatId: string) => {
    if (animatingChats.has(`${chatId}-pin`) || animatingChats.has(`${chatId}-unpin`)) return "pinning"
    if (animatingChats.has(`${chatId}-move`)) return "moving"
    if (animatingChats.has(`${chatId}-delete`)) return "deleting"
    if (animatingChats.has(`${chatId}-add`)) return "adding"
    return "animate"
  }

  return (
    <div className={cn("space-y-1", className)}>
      <AnimatePresence mode="popLayout">
        {chats.map((chat) => {
          const isAnimating = animatingChats.has(`${chat.id}-pin`) || 
                             animatingChats.has(`${chat.id}-unpin`) || 
                             animatingChats.has(`${chat.id}-move`) || 
                             animatingChats.has(`${chat.id}-delete`) || 
                             animatingChats.has(`${chat.id}-add`)
          const animationVariant = getAnimationVariant(chat.id)
          
          return (
            <motion.div
              key={chat.id}
              layout={!isAnimating}
              variants={itemVariants}
              initial="initial"
              animate={animationVariant}
              exit="exit"
              onAnimationComplete={(definition) => {
                if (typeof definition === 'object' && definition !== null) {
                  // Check if this is the final animation state
                  if (animationVariant === "deleting" || animationVariant === "pinning" || animationVariant === "moving") {
                    // Determine the specific operation for cleanup
                    if (animatingChats.has(`${chat.id}-pin`)) {
                      handleAnimationComplete(chat.id, "pin")
                    } else if (animatingChats.has(`${chat.id}-unpin`)) {
                      handleAnimationComplete(chat.id, "unpin")
                    } else if (animatingChats.has(`${chat.id}-delete`)) {
                      handleAnimationComplete(chat.id, "delete")
                    } else if (animatingChats.has(`${chat.id}-move`)) {
                      handleAnimationComplete(chat.id, "move")
                    }
                  }
                }
              }}
              whileHover={{ 
                scale: isAnimating ? 1 : 1.02,
                transition: { duration: 0.2 }
              }}
              whileTap={{ 
                scale: isAnimating ? 1 : 0.98,
                transition: { duration: 0.1 }
              }}
              className="relative"
              // Prevent exit animation for pin/unpin operations to avoid blank time
              style={{
                // Keep the element visible during pin/unpin transitions
                ...(isAnimating && (animatingChats.has(`${chat.id}-pin`) || animatingChats.has(`${chat.id}-unpin`)) && {
                  position: 'relative',
                  zIndex: 10
                }),
                // Ensure proper spacing and prevent layout issues
                marginBottom: isAnimating ? '0' : '4px'
              }}
            >
              <ChatListItem
                chat={chat}
                onClick={onChatClick}
                onTogglePin={onTogglePin}
                onDelete={onDelete}
                onMoveToFolder={onMoveToFolder}
                isActive={activeChatId === chat.id}
                folders={folders}
              />
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

// Enhanced ChatListItem with animation support
interface EnhancedChatListItemProps {
  chat: ChatItem
  onClick: (chatId: string) => void
  onTogglePin?: (chatId: string) => void
  onDelete?: (chatId: string) => void
  onMoveToFolder?: (chatId: string, folderId?: string) => void
  isActive?: boolean
  isCollapsed?: boolean
  isAnimating?: boolean
  className?: string
}

export function EnhancedChatListItem({
  chat,
  onClick,
  onTogglePin,
  onDelete,
  onMoveToFolder,
  isActive,
  isAnimating = false,
  className
}: EnhancedChatListItemProps) {
  return (
    <motion.div
      className={cn(
        "relative",
        isAnimating && "pointer-events-none",
        className
      )}
      whileHover={!isAnimating ? { scale: 1.02 } : undefined}
      whileTap={!isAnimating ? { scale: 0.98 } : undefined}
    >
      <ChatListItem
        chat={chat}
        onClick={onClick}
        onTogglePin={onTogglePin}
        onDelete={onDelete}
        onMoveToFolder={onMoveToFolder}
        isActive={isActive}
        className={cn(
          isAnimating && "opacity-70",
          className
        )}
      />
      
      {/* Animation overlay for special effects */}
      {isAnimating && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Add shimmer effect for move operations */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </motion.div>
      )}
    </motion.div>
  )
}
