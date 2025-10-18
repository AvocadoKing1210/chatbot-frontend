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
  ArrowLeft
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
  const [isLoading, setIsLoading] = React.useState(false)
  const [chartEnabled, setChartEnabled] = React.useState(chat.chartEnabled)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

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
  }, []) // Empty dependency array - only run on mount

  // Memoize messages to prevent unnecessary re-renders
  const memoizedMessages = React.useMemo(() => chat.messages, [chat.messages])

  const handleSendMessage = async (message: string) => {
    // Add user message
    addMessage(chat.id, message, 'user')
    setIsLoading(true)

    // Simulate AI response delay
    setTimeout(() => {
      const aiResponse = generateAIResponse(message)
      addMessage(chat.id, aiResponse, 'assistant')
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

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const MessageBubble = React.memo(({ message }: { message: Message }) => {
    const isUser = message.role === 'user'
    
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
          "max-w-[80%] rounded-lg px-4 py-2",
          isUser 
            ? "bg-primary text-primary-foreground ml-auto" 
            : "bg-muted"
        )}>
          <div className="whitespace-pre-wrap text-sm">
            {message.content}
          </div>
          <div className={cn(
            "text-xs mt-1 opacity-70",
            isUser ? "text-primary-foreground" : "text-muted-foreground"
          )}>
            {formatTimestamp(message.timestamp)}
          </div>
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
                onClick={() => {
                  if (confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
                    deleteChat(chat.id)
                    router.push('/')
                  }
                }}
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
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm text-muted-foreground">AI is thinking...</span>
              </div>
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
    </div>
  )
}
