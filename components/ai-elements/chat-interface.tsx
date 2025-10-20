"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Bot, 
  User, 
  SquarePen, 
  MoreVertical, 
  Star, 
  Trash2,
  Tag,
  ArrowLeft,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Share,
  X,
  Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { ChatInput } from "./chat-input"
import { Actions, Action } from "./actions"
import { CopyButton } from "@/components/ui/copy-button"
import { StreamingResponse } from "./streaming-response"
import { Conversation, ConversationContent, ConversationScrollButton } from "./conversation"
import { MessageActions } from "./message-actions"
import { Shimmer } from "./shimmer"
import { useChat } from "@/components/providers/chat-provider"
import { useMode } from "@/components/providers/mode-provider"
import { ChatItem, Message } from "@/data/chats"
import { modeConfig } from "@/data"
import { Database, CodeXml } from "lucide-react"
import type { SelectorOption } from "@/components/ai-elements/chat-input"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { DeleteChatDialog } from "@/components/ui/confirmation-dialog"

interface ChatInterfaceProps {
  chat: ChatItem
}

export function ChatInterface({ chat }: ChatInterfaceProps) {
  const router = useRouter()
  const { addMessage, updateChat, deleteChat, generateAIResponse, setChats } = useChat()
  const { selectedMode, setSelectedMode } = useMode()
  const isMobile = useIsMobile()
  const [isEditingTitle, setIsEditingTitle] = React.useState(false)
  const [editTitle, setEditTitle] = React.useState(chat.title)
  const [isEditingTags, setIsEditingTags] = React.useState(false)
  const [editTags, setEditTags] = React.useState<string[]>(chat.tags || [])
  const [newTag, setNewTag] = React.useState("")
  const [isDeletingChat, setIsDeletingChat] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [chartEnabled, setChartEnabled] = React.useState(chat.chartEnabled)
  const [messageFeedback, setMessageFeedback] = React.useState<Record<string, 'liked' | 'disliked' | null>>({})
  const [streamingMessages, setStreamingMessages] = React.useState<Set<string>>(new Set())
  const [stoppedMessageIds, setStoppedMessageIds] = React.useState<Set<string>>(new Set())
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const initialMessageProcessedRef = React.useRef(false)
  const pendingTimeoutsRef = React.useRef<Set<number>>(new Set())

  const clearAllPendingTimeouts = React.useCallback(() => {
    pendingTimeoutsRef.current.forEach((id) => clearTimeout(id))
    pendingTimeoutsRef.current.clear()
  }, [])

  const stopAllStreaming = React.useCallback(() => {
    // Mark all currently streaming messages as stopped so their StreamingResponse stops immediately
    setStoppedMessageIds(prev => {
      const next = new Set(prev)
      streamingMessages.forEach(id => next.add(id))
      return next
    })
    // Also stop loading indicator
    setIsLoading(false)
  }, [streamingMessages])

  // Create mode options with icons
  const modeOptions: SelectorOption[] = React.useMemo(() => {
    const iconMap = {
      Database: <Database className="w-4 h-4" />,
      CodeXml: <CodeXml className="w-4 h-4" />,
    }

    return modeConfig.map(config => ({
      id: config.id,
      name: config.name,
      description: config.description,
      icon: iconMap[config.iconName],
    }))
  }, [])

  // Stick-to-bottom is handled by Conversation; no manual scroll effect needed

  // Initialize mode and chart settings from chat data (only on mount)
  React.useEffect(() => {
    setSelectedMode(chat.mode)
    setChartEnabled(chat.chartEnabled)
    // Clear any streaming messages on mount - existing messages should not stream
    setStreamingMessages(new Set())
    setStoppedMessageIds(new Set())
    
    // Check if this is a new chat with only a user message (needs AI response)
    const hasOnlyUserMessage = chat.messages.length === 1 && chat.messages[0].role === 'user'
    if (hasOnlyUserMessage && !initialMessageProcessedRef.current) {
      initialMessageProcessedRef.current = true
      // Generate AI response for the initial user message
      const userMessage = chat.messages[0].content
      setIsLoading(true)
      
      const timeoutId = window.setTimeout(async () => {
        const aiResponse = generateAIResponse(userMessage)
        const messageId = await addMessage(chat.id, aiResponse, 'assistant')
        
        // Mark the new AI message for streaming
        if (messageId) {
          setStreamingMessages(prev => new Set(prev).add(messageId))
        }
        
        setIsLoading(false)
        pendingTimeoutsRef.current.delete(timeoutId)
      }, 1000 + Math.random() * 2000)
      pendingTimeoutsRef.current.add(timeoutId)
    }
  }, [chat.id]) // Only depend on chat.id to prevent re-running on message changes

  // Memoize messages to prevent unnecessary re-renders
  const memoizedMessages = React.useMemo(() => chat.messages, [chat.messages])

  const handleSendMessage = async (message: string) => {
    // If there's an ongoing stream or pending response, stop/clear them first
    if (streamingMessages.size > 0 || pendingTimeoutsRef.current.size > 0) {
      stopAllStreaming()
      clearAllPendingTimeouts()
    }
    // Add user message
    addMessage(chat.id, message, 'user')
    setIsLoading(true)
    // Do not clear stopped ids immediately to ensure StreamingResponse receives the stop signal

    // Simulate AI response delay
    const timeoutId = window.setTimeout(async () => {
      const aiResponse = generateAIResponse(message)
      const messageId = await addMessage(chat.id, aiResponse, 'assistant')
      
      // Mark the new AI message for streaming
      if (messageId) {
        setStreamingMessages(prev => new Set(prev).add(messageId))
      }
      
      setIsLoading(false)
      pendingTimeoutsRef.current.delete(timeoutId)
    }, 1000 + Math.random() * 2000) // 1-3 second delay
    pendingTimeoutsRef.current.add(timeoutId)
  }

  const handleStop = () => {
    stopAllStreaming()
    clearAllPendingTimeouts()
  }

  const handleModeChange = (mode: string) => {
    const newMode = mode as "sql" | "python"
    setSelectedMode(newMode)
    // Update chat data without triggering currentChat update to prevent bouncing
    setChats(prev => prev.map(c => 
      c.id === chat.id ? { ...c, mode: newMode } : c
    ))
  }

  const handleChartToggle = (enabled: boolean) => {
    setChartEnabled(enabled)
    // Update chat data without triggering currentChat update to prevent bouncing
    setChats(prev => prev.map(c => 
      c.id === chat.id ? { ...c, chartEnabled: enabled } : c
    ))
  }

  const handleUpdateTitle = () => {
    if (editTitle.trim() && editTitle !== chat.title) {
      updateChat(chat.id, { title: editTitle.trim() })
    }
    setIsEditingTitle(false)
  }

  const handleUpdateTags = () => {
    updateChat(chat.id, { tags: editTags })
    setIsEditingTags(false)
  }

  const handleAddTag = () => {
    const trimmedTag = newTag.trim()
    if (trimmedTag && !editTags.includes(trimmedTag)) {
      setEditTags([...editTags, trimmedTag])
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setEditTags(editTags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleDeleteChat = () => {
    deleteChat(chat.id)
    router.push('/')
    setIsDeletingChat(false)
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const handleRegenerateMessage = (messageId: string) => {
    // Find the message and regenerate it
    const messageIndex = chat.messages.findIndex(m => m.id === messageId)
    if (messageIndex > 0) {
      const previousMessage = chat.messages[messageIndex - 1]
      if (previousMessage.role === 'user') {
        // Remove the current message and regenerate
        const updatedMessages = chat.messages.slice(0, messageIndex)
        setChats(prev => prev.map(c => 
          c.id === chat.id ? { ...c, messages: updatedMessages } : c
        ))
        // Trigger regeneration
        const timeoutId = window.setTimeout(async () => {
          const aiResponse = generateAIResponse(previousMessage.content)
          const newMessageId = await addMessage(chat.id, aiResponse, 'assistant')
          
          // Mark the regenerated message for streaming
          if (newMessageId) {
            setStreamingMessages(prev => new Set(prev).add(newMessageId))
          }
          pendingTimeoutsRef.current.delete(timeoutId)
        }, 500)
        pendingTimeoutsRef.current.add(timeoutId)
      }
    }
  }

  const handleMessageFeedback = (messageId: string, feedback: 'liked' | 'disliked') => {
    setMessageFeedback(prev => ({
      ...prev,
      [messageId]: prev[messageId] === feedback ? null : feedback
    }))
  }


  const handleShareMessage = (messageId: string) => {
    // You could implement sharing functionality here
    console.log('Sharing message:', messageId)
  }

  const handleStreamComplete = (messageId: string) => {
    setStreamingMessages(prev => {
      const newSet = new Set(prev)
      newSet.delete(messageId)
      return newSet
    })
    // Clean up stop flag for this message to avoid accumulation
    setStoppedMessageIds(prev => {
      const next = new Set(prev)
      next.delete(messageId)
      return next
    })
  }

  // Cleanup any pending timeouts on unmount
  React.useEffect(() => {
    return () => {
      clearAllPendingTimeouts()
    }
  }, [clearAllPendingTimeouts])

  // Separate component for message actions to isolate feedback state
  const MessageActionsWrapper = React.memo(({ messageId, messageContent, timestamp }: { 
    messageId: string
    messageContent: string
    timestamp: string
  }) => {
    const currentFeedback = messageFeedback[messageId]
    
    return (
      <MessageActions
        messageId={messageId}
        messageContent={messageContent}
        currentFeedback={currentFeedback}
        onRegenerate={handleRegenerateMessage}
        onFeedback={handleMessageFeedback}
        onShare={handleShareMessage}
        timestamp={timestamp}
      />
    )
  })

  const MessageBubble = React.memo(({
    message,
    isStreaming,
    isStopped
  }: { message: Message; isStreaming: boolean; isStopped: boolean }) => {
    const isUser = message.role === 'user'
    const isMobile = useIsMobile()
    
    return (
      <div
        key={message.id}
        className={cn(
          "flex gap-3 p-4",
          isUser ? "justify-end" : "justify-start"
        )}
      >
        {!isUser && !isMobile && (
          <div className="flex-shrink-0">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground">
              <Bot className="h-4 w-4" />
            </div>
          </div>
        )}
        
        <div className={cn(
          isMobile ? "w-full" : "max-w-[90%]",
          isUser ? "ml-auto" : ""
        )}>
          <div className={cn(
            "rounded-lg px-4 py-2",
            isUser 
              ? "bg-primary text-primary-foreground" 
              : ""
          )}>
            {isUser ? (
              <div className="whitespace-pre-wrap text-sm">
                {message.content}
              </div>
            ) : (
              <StreamingResponse
                key={message.id} // Use stable key to prevent unnecessary re-mounts
                content={message.content}
                isStreaming={isStreaming}
                onStreamComplete={() => handleStreamComplete(message.id)}
                shouldStop={isStopped}
              />
            )}
          </div>
          
          {/* Actions and timestamp row - only show for non-streaming content */}
          {!isUser && !isStreaming && (
            <MessageActionsWrapper
              messageId={message.id}
              messageContent={message.content}
              timestamp={message.timestamp}
            />
          )}
          
          {/* Timestamp for user messages */}
          {isUser && (
            <div className="mt-1 flex justify-end">
              <div className="text-xs text-muted-foreground opacity-70">
                {formatTimestamp(message.timestamp)}
              </div>
            </div>
          )}
        </div>

        {isUser && !isMobile && (
          <div className="flex-shrink-0">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-muted">
              <User className="h-4 w-4" />
            </div>
          </div>
        )}
      </div>
    )
  }, (prevProps, nextProps) => {
    // Custom comparison function to prevent re-renders when only feedback changes
    // Only re-render if the message content or streaming status changes
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.content === nextProps.message.content &&
      prevProps.message.role === nextProps.message.role &&
      prevProps.message.timestamp === nextProps.message.timestamp &&
      prevProps.isStreaming === nextProps.isStreaming &&
      prevProps.isStopped === nextProps.isStopped
    )
  })

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header - Fixed */}
      <div className="flex-shrink-0 border-b p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/')}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            {isEditingTitle ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdateTitle()
                    if (e.key === 'Escape') {
                      setEditTitle(chat.title)
                      setIsEditingTitle(false)
                    }
                  }}
                  className="h-8"
                  autoFocus
                />
                <Button size="sm" onClick={handleUpdateTitle}>
                  Save
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => {
                    setEditTitle(chat.title)
                    setIsEditingTitle(false)
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <h1 className="text-lg font-semibold cursor-pointer hover:text-muted-foreground transition-colors"
                  onClick={() => setIsEditingTitle(true)}>
                {chat.title}
              </h1>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
                <SquarePen className="mr-2 h-4 w-4" />
                Edit Title
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsEditingTags(true)}>
                <Tag className="mr-2 h-4 w-4" />
                Edit Tags
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateChat(chat.id, { pinned: !chat.pinned })}>
                <Star className="mr-2 h-4 w-4" />
                {chat.pinned ? 'Unpin' : 'Pin'} Chat
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => setIsDeletingChat(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Updated {new Date(chat.updatedAt).toLocaleDateString()}</span>
          <span>•</span>
          <span>{chat.messages.length} messages</span>
          <span>•</span>
          <Badge variant="secondary" className="text-xs">
            {chat.mode.toUpperCase()}
          </Badge>
          {chat.chartEnabled && (
            <Badge variant="outline" className="text-xs">
              Charts
            </Badge>
          )}
        </div>

        {/* Tags */}
        {chat.tags && chat.tags.length > 0 && (
          <div className="flex gap-1 mt-2">
            {chat.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Messages Area - Stick-to-bottom */}
      <Conversation className="flex-1 min-h-0">
        <ConversationContent>
          {memoizedMessages.map((message) => (
            <MessageBubble 
              key={message.id} 
              message={message} 
              isStreaming={streamingMessages.has(message.id)} 
              isStopped={stoppedMessageIds.has(message.id)} 
            />
          ))}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 p-4"
            >
              {!isMobile && (
                <div className="flex-shrink-0">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </div>
                </div>
              )}
              <div className={cn(
                "rounded-lg px-4 py-2",
                isMobile ? "w-full" : ""
              )}>
                <Shimmer className="text-sm">
                  AI is thinking...
                </Shimmer>
              </div>
            </motion.div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Chat Input - Fixed */}
      <div className="flex-shrink-0 border-t p-4">
        <ChatInput
          onSend={handleSendMessage}
          submitStatus={streamingMessages.size > 0 ? "streaming" : isLoading ? "submitted" : undefined}
          onStop={handleStop}
          inputDisabled={isLoading && streamingMessages.size === 0}
          placeholder={
            selectedMode === "sql" 
              ? chartEnabled 
                ? "Ask me to write SQL queries and create charts automatically..." 
                : "Ask me to write SQL queries..."
              : chartEnabled 
                ? "Ask me to write Python scripts and create charts automatically..." 
                : "Ask me to write Python scripts..."
          }
          showSelector={true}
          selectorOptions={modeOptions}
          selectedValue={selectedMode}
          onSelectorChange={handleModeChange}
          selectorLabel="Select Mode"
          showChart={true}
          chartEnabled={chartEnabled}
          onChartToggle={handleChartToggle}
          disabled={isLoading}
        />
      </div>

      {/* Edit Tags Dialog */}
      <Dialog open={isEditingTags} onOpenChange={setIsEditingTags}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Edit Tags
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Existing Tags */}
            {editTags.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Current Tags</label>
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence mode="popLayout">
                    {editTags.map((tag) => (
                      <motion.div
                        key={tag}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary/50 border border-border rounded-full text-sm font-medium text-foreground shadow-sm"
                      >
                        <span className="text-xs">{tag}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 rounded-full hover:bg-transparent"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Add New Tag */}
            <div>
              <label className="text-sm font-medium mb-3 block">Add New Tag</label>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter tag name"
                  className="flex-1"
                />
                <Button
                  onClick={handleAddTag}
                  disabled={!newTag.trim() || editTags.includes(newTag.trim())}
                  size="sm"
                  className="px-3"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsEditingTags(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateTags} className="min-w-[100px]">
                Save Tags
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Chat Dialog */}
      <DeleteChatDialog
        open={isDeletingChat}
        onOpenChange={setIsDeletingChat}
        chatTitle={chat.title}
        onConfirm={handleDeleteChat}
      />
    </div>
  )
}
