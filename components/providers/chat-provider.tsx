"use client"

import * as React from "react"
import { 
  ChatItem, 
  Message, 
  CreateChatData, 
  createNewChat, 
  addMessageToChat, 
  updateChatTitle, 
  updateChatTags,
  pinnedChats,
  recentChats
} from "@/data/chats"

interface ChatContextType {
  // Current chat state
  currentChat: ChatItem | null
  setCurrentChat: (chat: ChatItem | null) => void
  
  // Chat list state
  chats: ChatItem[]
  setChats: React.Dispatch<React.SetStateAction<ChatItem[]>>
  
  // Chat operations
  createChat: (data: CreateChatData) => ChatItem
  addMessage: (chatId: string, content: string, role: 'user' | 'assistant') => void
  updateChat: (chatId: string, updates: Partial<ChatItem>) => void
  deleteChat: (chatId: string) => void
  
  // AI response simulation
  generateAIResponse: (userMessage: string) => string
}

const ChatContext = React.createContext<ChatContextType | undefined>(undefined)

export function useChat() {
  const context = React.useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}

interface ChatProviderProps {
  children: React.ReactNode
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [currentChat, setCurrentChat] = React.useState<ChatItem | null>(null)
  const [chats, setChats] = React.useState<ChatItem[]>([...pinnedChats, ...recentChats])

  // Generate mock AI responses
  const generateAIResponse = React.useCallback((userMessage: string): string => {
    const responses = [
      "That's a great question! Let me help you with that. Based on what you've asked, I can provide some insights and guidance.",
      
      "I understand what you're looking for. Here's what I can tell you about this topic:\n\n1. First, let's consider the main aspects\n2. Then we can explore the implementation details\n3. Finally, I'll provide some best practices\n\nWould you like me to elaborate on any of these points?",
      
      "Excellent question! This is a common challenge that many developers face. Here's my approach to solving this:\n\n**Key Points:**\n- Understanding the requirements is crucial\n- Planning the architecture before implementation\n- Testing thoroughly at each step\n\nLet me know if you'd like me to dive deeper into any specific area!",
      
      "I'd be happy to help you with that! This is actually one of my favorite topics to discuss. Here's what I recommend:\n\n```\n// Example approach\nconst solution = {\n  step1: 'Analyze the problem',\n  step2: 'Design the solution',\n  step3: 'Implement and test'\n};\n```\n\nWhat specific aspect would you like to explore further?",
      
      "That's an interesting challenge! Let me break this down for you:\n\n**Analysis:**\n- The problem involves multiple components\n- We need to consider scalability\n- Performance optimization is important\n\n**Solution Approach:**\n1. Start with a simple implementation\n2. Add complexity gradually\n3. Monitor and optimize as needed\n\nWould you like me to show you a practical example?"
    ]
    
    // Simple hash function to get consistent responses for similar messages
    const hash = userMessage.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    
    return responses[Math.abs(hash) % responses.length]
  }, [])

  const createChat = React.useCallback((data: CreateChatData): ChatItem => {
    const newChat = createNewChat(data)
    setChats(prev => [newChat, ...prev])
    setCurrentChat(newChat)
    return newChat
  }, [])

  const addMessage = React.useCallback((chatId: string, content: string, role: 'user' | 'assistant') => {
    setChats(prev => {
      const updatedChats = prev.map(chat => {
        if (chat.id === chatId) {
          const updatedChat = addMessageToChat(chat, content, role)
          if (currentChat?.id === chatId) {
            setCurrentChat(updatedChat)
          }
          return updatedChat
        }
        return chat
      })
      return updatedChats
    })
  }, [currentChat])

  const updateChat = React.useCallback((chatId: string, updates: Partial<ChatItem>) => {
    setChats(prev => {
      const updatedChats = prev.map(chat => {
        if (chat.id === chatId) {
          // Only update timestamp for meaningful changes (not just mode/chart toggles)
          const shouldUpdateTimestamp = updates.title || updates.tags || updates.messages
          const updatedChat = { 
            ...chat, 
            ...updates, 
            ...(shouldUpdateTimestamp && { updatedAt: new Date().toISOString() })
          }
          
          // Only update currentChat for meaningful changes to prevent message bouncing
          if (currentChat?.id === chatId && (updates.title || updates.tags || updates.messages)) {
            setCurrentChat(updatedChat)
          }
          
          return updatedChat
        }
        return chat
      })
      return updatedChats
    })
  }, [currentChat])

  const deleteChat = React.useCallback((chatId: string) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId))
    if (currentChat?.id === chatId) {
      setCurrentChat(null)
    }
  }, [currentChat])

  const value: ChatContextType = {
    currentChat,
    setCurrentChat,
    chats,
    setChats,
    createChat,
    addMessage,
    updateChat,
    deleteChat,
    generateAIResponse
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}
