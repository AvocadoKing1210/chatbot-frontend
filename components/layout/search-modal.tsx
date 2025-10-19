"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Search as SearchIcon, Plus, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChatItem } from "@/data/chats"

interface SearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversations: ChatItem[]
  onSelectConversation: (id: string) => void
  onCreateNewChat: () => void
  className?: string
}

function getTimeGroup(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  if (date >= today) return "Today"
  if (date >= yesterday) return "Yesterday"
  if (date >= sevenDaysAgo) return "Previous 7 Days"
  return "Older"
}

export function SearchModal({
  open,
  onOpenChange,
  conversations,
  onSelectConversation,
  onCreateNewChat,
  className,
}: SearchModalProps) {
  const [query, setQuery] = React.useState("")

  const filteredConversations = React.useMemo(() => {
    if (!query.trim()) return conversations
    const q = query.toLowerCase()
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.preview.toLowerCase().includes(q) ||
        (c.tags || []).some((t) => t.toLowerCase().includes(q))
    )
  }, [conversations, query])

  const groupedConversations = React.useMemo(() => {
    const groups: Record<string, ChatItem[]> = {
      Today: [],
      Yesterday: [],
      "Previous 7 Days": [],
      Older: [],
    }

    filteredConversations
      .slice()
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
      .forEach((conv) => {
        const group = getTimeGroup(conv.updatedAt)
        groups[group].push(conv)
      })

    return groups
  }, [filteredConversations])

  const handleClose = () => {
    setQuery("")
    onOpenChange(false)
  }

  const handleNewChat = () => {
    onCreateNewChat()
    handleClose()
  }

  const handleSelectConversation = (id: string) => {
    onSelectConversation(id)
    handleClose()
  }

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -12 }}
            transition={{ duration: 0.12, ease: "easeInOut" }}
            className={cn(
              "fixed left-1/2 top-[18%] z-50 w-full max-w-2xl -translate-x-1/2 rounded-2xl border bg-popover text-popover-foreground shadow-2xl",
              "border-border",
              className
            )}
          >
            <div className="flex items-center gap-3 border-b p-3 md:p-4 border-border">
              <SearchIcon className="h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search chats, tags..."
                className="flex-1 bg-transparent text-base md:text-lg outline-none placeholder:text-muted-foreground"
                autoFocus
              />
              <button
                onClick={handleClose}
                className="rounded-lg p-1.5 hover:bg-accent"
                aria-label="Close search"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              <div className="border-b border-border p-2">
                <button
                  onClick={handleNewChat}
                  className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-accent"
                >
                  <Plus className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">New chat</span>
                </button>
              </div>

              {Object.entries(groupedConversations).map(([groupName, convs]) => {
                if (convs.length === 0) return null
                return (
                  <div
                    key={groupName}
                    className="border-b border-border p-2 last:border-b-0"
                  >
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
                      {groupName}
                    </div>
                    <div className="space-y-1">
                      {convs.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => handleSelectConversation(conv.id)}
                          className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-accent"
                        >
                          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">{conv.title}</div>
                            <div className="truncate text-sm text-muted-foreground">
                              {conv.preview}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}

              {filteredConversations.length === 0 && query.trim() && (
                <div className="p-8 text-center">
                  <SearchIcon className="mx-auto h-12 w-12 text-muted-foreground/40" />
                  <div className="mt-4 text-base md:text-lg font-medium">No chats found</div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Try different keywords
                  </div>
                </div>
              )}

              {!query.trim() && conversations.length === 0 && (
                <div className="p-8 text-center">
                  <div className="text-base md:text-lg font-medium">No conversations yet</div>
                  <div className="mt-2 text-sm text-muted-foreground">Start a new chat to begin</div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default SearchModal


