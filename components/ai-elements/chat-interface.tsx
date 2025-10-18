"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Bot, 
  User, 
  Edit3, 
  MoreVertical, 
  Pin, 
  Trash2,
  Tag,
  ArrowLeft,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Share
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
import { Shimmer } from "./shimmer"
import { useChat } from "@/components/providers/chat-provider"
import { useMode } from "@/components/providers/mode-provider"
import { ChatItem, Message } from "@/data/chats"
import { modeConfig } from "@/data"
import { Database, CodeXml } from "lucide-react"
import type { SelectorOption } from "@/components/ai-elements/chat-input"
import { cn } from "@/lib/utils"

interface ChatInterfaceProps {
  chat: ChatItem
}

export function ChatInterface({ chat }: ChatInterfaceProps) {
  const router = useRouter()
  const { addMessage, updateChat, deleteChat, generateAIResponse, setChats } = useChat()
  const { selectedMode, setSelectedMode } = useMode()
  const [isEditingTitle, setIsEditingTitle] = React.useState(false)
  const [editTitle, setEditTitle] = React.useState(chat.title)
  const [isEditingTags, setIsEditingTags] = React.useState(false)
  const [editTags, setEditTags] = React.useState(chat.tags?.join(", ") || "")
  const [isDeletingChat, setIsDeletingChat] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [chartEnabled, setChartEnabled] = React.useState(chat.chartEnabled)
  const [messageFeedback, setMessageFeedback] = React.useState<Record<string, 'liked' | 'disliked' | null>>({})
  const [streamingMessages, setStreamingMessages] = React.useState<Set<string>>(new Set())
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const initialMessageProcessedRef = React.useRef(false)

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [chat.messages])

  // Initialize mode and chart settings from chat data (only on mount)
  React.useEffect(() => {
    setSelectedMode(chat.mode)
    setChartEnabled(chat.chartEnabled)
    // Clear any streaming messages on mount - existing messages should not stream
    setStreamingMessages(new Set())
    
    // Check if this is a new chat with only a user message (needs AI response)
    const hasOnlyUserMessage = chat.messages.length === 1 && chat.messages[0].role === 'user'
    if (hasOnlyUserMessage && !initialMessageProcessedRef.current) {
      initialMessageProcessedRef.current = true
      // Generate AI response for the initial user message
      const userMessage = chat.messages[0].content
      setIsLoading(true)
      
      setTimeout(() => {
        const aiResponse = generateAIResponse(userMessage)
        const messageId = addMessage(chat.id, aiResponse, 'assistant')
        
        // Mark the new AI message for streaming
        setStreamingMessages(prev => new Set(prev).add(messageId))
        
        setIsLoading(false)
      }, 1000 + Math.random() * 2000)
    }
  }, [chat.id, chat.messages, generateAIResponse, addMessage]) // Dependencies for initial message handling

  // Memoize messages to prevent unnecessary re-renders
  const memoizedMessages = React.useMemo(() => chat.messages, [chat.messages])

  const handleSendMessage = async (message: string) => {
    // Add user message
    addMessage(chat.id, message, 'user')
    setIsLoading(true)

    // Simulate AI response delay
    setTimeout(() => {
      const aiResponse = generateAIResponse(message)
      const messageId = addMessage(chat.id, aiResponse, 'assistant')
      
      // Mark the new AI message for streaming
      setStreamingMessages(prev => new Set(prev).add(messageId))
      
      setIsLoading(false)
    }, 1000 + Math.random() * 2000) // 1-3 second delay
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
    const tags = editTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    updateChat(chat.id, { tags })
    setIsEditingTags(false)
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
        setTimeout(() => {
          const aiResponse = generateAIResponse(previousMessage.content)
          const newMessageId = addMessage(chat.id, aiResponse, 'assistant')
          
          // Mark the regenerated message for streaming
          setStreamingMessages(prev => new Set(prev).add(newMessageId))
        }, 500)
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
  }

  const MessageBubble = React.memo(({ message }: { message: Message }) => {
    const isUser = message.role === 'user'
    const currentFeedback = messageFeedback[message.id]
    const isStreaming = streamingMessages.has(message.id)
    
    return (
      <div
        className={cn(
          "flex gap-3 p-4",
          isUser ? "justify-end" : "justify-start"
        )}
      >
        {!isUser && (
          <div className="flex-shrink-0">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground">
              <Bot className="h-4 w-4" />
            </div>
          </div>
        )}
        
        <div className={cn(
          "max-w-[90%]",
          isUser ? "ml-auto" : ""
        )}>
          <div className={cn(
            "rounded-lg px-4 py-2",
            isUser 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted"
          )}>
            {isUser ? (
              <div className="whitespace-pre-wrap text-sm">
                {message.content}
              </div>
            ) : (
              <StreamingResponse
                content={message.content}
                isStreaming={isStreaming}
                onStreamComplete={() => handleStreamComplete(message.id)}
              />
            )}
          </div>
          
          {/* Actions and timestamp row */}
          {!isUser && (
            <div className="mt-2 flex items-center justify-between">
              <Actions>
                <Action
                  tooltip="Regenerate response"
                  onClick={(e) => {
                    e.preventDefault()
                    handleRegenerateMessage(message.id)
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                </Action>
                <Action
                  tooltip="Good response"
                  onClick={(e) => {
                    e.preventDefault()
                    handleMessageFeedback(message.id, 'liked')
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
                    handleMessageFeedback(message.id, 'disliked')
                  }}
                  className={cn(
                    currentFeedback === 'disliked' && "text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  )}
                >
                  <ThumbsDown className="h-4 w-4" />
                </Action>
                <CopyButton
                  text={message.content}
                  tooltip="Copy message"
                />
                <Action
                  tooltip="Share message"
                  onClick={(e) => {
                    e.preventDefault()
                    handleShareMessage(message.id)
                  }}
                >
                  <Share className="h-4 w-4" />
                </Action>
              </Actions>
              <div className="text-xs text-muted-foreground opacity-70">
                {formatTimestamp(message.timestamp)}
              </div>
            </div>
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

        {isUser && (
          <div className="flex-shrink-0">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-muted">
              <User className="h-4 w-4" />
            </div>
          </div>
        )}
      </div>
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
                <Edit3 className="mr-2 h-4 w-4" />
                Edit Title
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsEditingTags(true)}>
                <Tag className="mr-2 h-4 w-4" />
                Edit Tags
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateChat(chat.id, { pinned: !chat.pinned })}>
                <Pin className="mr-2 h-4 w-4" />
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

      {/* Messages Area - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {memoizedMessages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 p-4"
          >
            <div className="flex-shrink-0">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </div>
            </div>
            <div className="bg-muted rounded-lg px-4 py-2">
              <Shimmer className="text-sm">
                AI is thinking...
              </Shimmer>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input - Fixed */}
      <div className="flex-shrink-0 border-t p-4">
        <ChatInput
          onSend={handleSendMessage}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tags</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tags (comma-separated)</label>
              <Input
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="design, ui, components"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditingTags(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateTags}>
                Save Tags
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Chat Dialog */}
      <Dialog open={isDeletingChat} onOpenChange={setIsDeletingChat}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Are you sure you want to delete "{chat.title}"? This action cannot be undone and will permanently remove all messages in this chat.
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeletingChat(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteChat}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Chat
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
