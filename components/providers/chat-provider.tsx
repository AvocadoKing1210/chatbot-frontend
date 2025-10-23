"use client"

import * as React from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { useAIChat } from "@/hooks/use-ai-chat"
import { 
  ChatItem, 
  Message, 
  CreateChatData, 
  createNewChat, 
  addMessageToChat, 
  updateChatTitle, 
  updateChatTags,
  getChats,
  getPinnedChats,
  getRecentChats,
  createChat,
  updateChat,
  deleteChat,
  addMessageToChatDB,
  updateChatTagsInDB
} from "@/data/chats"
import { 
  FolderItem, 
  CreateFolderData, 
  createNewFolder, 
  updateFolder as updateFolderUtil, 
  addChatToFolder, 
  removeChatFromFolder, 
  moveChatBetweenFolders,
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  moveChatToFolder
} from "@/data/folders"

interface ChatContextType {
  // Current chat state
  currentChat: ChatItem | null
  setCurrentChat: (chat: ChatItem | null) => void
  
  // Chat list state
  chats: ChatItem[]
  setChats: React.Dispatch<React.SetStateAction<ChatItem[]>>
  
  // Folder state
  folders: FolderItem[]
  setFolders: React.Dispatch<React.SetStateAction<FolderItem[]>>
  
  // Loading states
  isLoading: boolean
  
  // Animation states
  animatingChats: Set<string>
  setAnimatingChats: React.Dispatch<React.SetStateAction<Set<string>>>
  animatingFolders: Set<string>
  setAnimatingFolders: React.Dispatch<React.SetStateAction<Set<string>>>
  
  // Chat operations
  createChat: (data: CreateChatData) => Promise<ChatItem>
  addMessage: (chatId: string, content: string, role: 'user' | 'assistant') => Promise<string>
  updateChat: (chatId: string, updates: Partial<ChatItem>) => Promise<void>
  deleteChat: (chatId: string) => Promise<void>
  togglePin: (chatId: string) => void
  
  // Folder operations
  createFolder: (data: CreateFolderData) => Promise<FolderItem>
  updateFolder: (folderId: string, updates: Partial<FolderItem>) => Promise<void>
  deleteFolder: (folderId: string) => Promise<void>
  moveChatToFolder: (chatId: string, folderId?: string) => Promise<void>
  
  // Animation operations
  animateChatOperation: (chatId: string, operation: 'pin' | 'unpin' | 'move' | 'delete' | 'add') => void
  onAnimationComplete: (chatId: string, animationType: string) => void
  animateFolderOperation: (folderId: string, operation: 'delete' | 'add') => void
  onFolderAnimationComplete: (folderId: string, animationType: string) => void
  
  // AI response generation
  generateAIResponse: (userMessage: string, mode?: 'sql' | 'python' | 'general', context?: string) => Promise<string>
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
  const { user } = useAuth()
  const { generateSQLQuery, generatePythonScript, generateGeneralResponse, isLoading: aiLoading, error: aiError } = useAIChat({
    onError: (error) => {
      console.error('AI Service Error:', error)
    }
  })
  const [currentChat, setCurrentChat] = React.useState<ChatItem | null>(null)
  const [chats, setChats] = React.useState<ChatItem[]>([])
  const [folders, setFolders] = React.useState<FolderItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [animatingChats, setAnimatingChats] = React.useState<Set<string>>(new Set())
  const [animatingFolders, setAnimatingFolders] = React.useState<Set<string>>(new Set())
  
  // Load data when user is authenticated
  React.useEffect(() => {
    if (user?.id) {
      loadUserData()
    } else {
      setChats([])
      setFolders([])
      setIsLoading(false)
    }
  }, [user?.id])

  const loadUserData = async () => {
    if (!user?.id) return
    
    try {
      setIsLoading(true)
      
      // Fetch chats and folders in parallel
      const [userChats, userFolders] = await Promise.all([
        getChats(user.id),
        getFolders(user.id)
      ])
      
      setChats(userChats)
      setFolders(userFolders)
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter out empty chats (chats with no messages) for display purposes
  const nonEmptyChats = React.useMemo(() => 
    chats.filter(chat => chat.messages.length > 0), 
    [chats]
  )

  // Generate AI responses using the real AI service
  const generateAIResponse = React.useCallback(async (
    userMessage: string, 
    mode: 'sql' | 'python' | 'general' = 'general',
    context?: string
  ): Promise<string> => {
    try {
      switch (mode) {
        case 'sql':
          return await generateSQLQuery(userMessage, context)
        case 'python':
          return await generatePythonScript(userMessage, context)
        default:
          return await generateGeneralResponse(userMessage, context)
      }
    } catch (error) {
      console.error('Error generating AI response:', error)
      // Fallback to a simple error message
      return `I apologize, but I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`
    }
  }, [generateSQLQuery, generatePythonScript, generateGeneralResponse])

  // Animation functions
  const animateChatOperation = React.useCallback((chatId: string, operation: 'pin' | 'unpin' | 'move' | 'delete' | 'add') => {
    const animationKey = `${chatId}-${operation}`
    setAnimatingChats(prev => new Set([...prev, animationKey]))
  }, [])

  const onAnimationComplete = React.useCallback((chatId: string, animationType: string) => {
    const animationKey = `${chatId}-${animationType}`
    // Immediate cleanup for pin/unpin operations to eliminate blank time
    setAnimatingChats(prev => {
      const newSet = new Set(prev)
      newSet.delete(animationKey)
      return newSet
    })
  }, [])

  // Folder animation functions
  const animateFolderOperation = React.useCallback((folderId: string, operation: 'delete' | 'add') => {
    const animationKey = `${folderId}-${operation}`
    setAnimatingFolders(prev => new Set([...prev, animationKey]))
  }, [])

  const onFolderAnimationComplete = React.useCallback((folderId: string, animationType: string) => {
    const animationKey = `${folderId}-${animationType}`
    setAnimatingFolders(prev => {
      const newSet = new Set(prev)
      newSet.delete(animationKey)
      return newSet
    })
  }, [])

  const createChatHandler = React.useCallback(async (data: CreateChatData): Promise<ChatItem> => {
    if (!user?.id) throw new Error('User not authenticated')
    
    try {
      const newChat = await createChat(user.id, data)
      setChats(prev => [newChat, ...prev])
      
      // Animate the new chat
      animateChatOperation(newChat.id, 'add')
      
      // Only set as current chat if it has an initial message
      if (data.initialMessage) {
        setCurrentChat(newChat)
      }
      
      return newChat
    } catch (error) {
      console.error('Error creating chat:', error)
      throw error
    }
  }, [user?.id])

  const addMessage = React.useCallback(async (chatId: string, content: string, role: 'user' | 'assistant'): Promise<string> => {
    try {
      // Add message to database
      const newMessage = await addMessageToChatDB(chatId, content, role)
      
      // Update local state
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
      
      return newMessage.id
    } catch (error) {
      console.error('Error adding message:', error)
      throw error
    }
  }, [currentChat])

  const updateChatHandler = React.useCallback(async (chatId: string, updates: Partial<ChatItem>) => {
    try {
      // Update in database
      await updateChat(chatId, updates)
      
      // Update local state
      setChats(prev => {
        const updatedChats = prev.map(chat => {
          if (chat.id === chatId) {
            // Only update timestamp for meaningful changes (not just mode/chart toggles)
            const shouldUpdateTimestamp = updates.title || updates.tags || updates.messages
            const updatedChat = { 
              ...chat, 
              ...updates, 
              // Update preview to match title when title changes
              ...(updates.title && { preview: updates.title }),
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
    } catch (error) {
      console.error('Error updating chat:', error)
      throw error
    }
  }, [currentChat])

  const deleteChatHandler = React.useCallback(async (chatId: string) => {
    try {
      // Start delete animation
      animateChatOperation(chatId, 'delete')
      
      // Wait for animation to complete before actually deleting
      setTimeout(async () => {
        try {
          // Delete from database
          await deleteChat(chatId)
          
          // Update local state
          setChats(prev => prev.filter(chat => chat.id !== chatId))
          if (currentChat?.id === chatId) {
            setCurrentChat(null)
          }
        } catch (error) {
          console.error('Error deleting chat:', error)
        }
      }, 200) // Reduced to match new animation duration
    } catch (error) {
      console.error('Error deleting chat:', error)
      throw error
    }
  }, [currentChat, animateChatOperation])

  const togglePin = React.useCallback((chatId: string) => {
    const chat = chats.find(c => c.id === chatId)
    if (!chat) return
    
    // Start pin animation immediately
    animateChatOperation(chatId, chat.pinned ? 'unpin' : 'pin')
    
    // Update local state immediately for instant UI feedback
    setChats(prev => {
      const updatedChats = prev.map(chat => {
        if (chat.id === chatId) {
          const updatedChat = { 
            ...chat, 
            pinned: !chat.pinned,
            updatedAt: new Date().toISOString()
          }
          
          // Update currentChat if it's the one being pinned/unpinned
          if (currentChat?.id === chatId) {
            setCurrentChat(updatedChat)
          }
          
          return updatedChat
        }
        return chat
      })
      return updatedChats
    })
    
    // Update database in background (don't wait for it)
    updateChat(chatId, { pinned: !chat.pinned }).catch(error => {
      console.error('Error updating pin in database:', error)
      // Revert the local state if database update fails
      setChats(prev => {
        const revertedChats = prev.map(chat => {
          if (chat.id === chatId) {
            return { 
              ...chat, 
              pinned: chat.pinned, // Revert to original state
              updatedAt: new Date().toISOString()
            }
          }
          return chat
        })
        return revertedChats
      })
      // Also revert currentChat if it was updated
      if (currentChat?.id === chatId) {
        setCurrentChat(prev => prev ? { ...prev, pinned: chat.pinned } : null)
      }
    })
  }, [currentChat, chats, animateChatOperation])

  // Folder operations
  const createFolderHandler = React.useCallback(async (data: CreateFolderData): Promise<FolderItem> => {
    if (!user?.id) throw new Error('User not authenticated')
    
    try {
      const newFolder = await createFolder(user.id, data)
      setFolders(prev => [newFolder, ...prev])
      
      // Animate the new folder
      animateFolderOperation(newFolder.id, 'add')
      
      return newFolder
    } catch (error) {
      console.error('Error creating folder:', error)
      throw error
    }
  }, [user?.id, animateFolderOperation])

  const updateFolderHandler = React.useCallback(async (folderId: string, updates: Partial<FolderItem>) => {
    try {
      // Update in database
      await updateFolder(folderId, {
        name: updates.name,
        description: updates.description
      })
      
      // Update local state
      setFolders(prev => {
        const updatedFolders = prev.map(folder => {
          if (folder.id === folderId) {
            return {
              ...folder,
              ...updates,
              updatedAt: new Date().toISOString()
            }
          }
          return folder
        })
        return updatedFolders
      })
    } catch (error) {
      console.error('Error updating folder:', error)
      throw error
    }
  }, [])

  const deleteFolderHandler = React.useCallback(async (folderId: string) => {
    try {
      // Start delete animation
      animateFolderOperation(folderId, 'delete')
      
      // Wait for animation to complete before actually deleting
      setTimeout(async () => {
        try {
          // Delete from database
          await deleteFolder(folderId)
          
          // Update local state
          setFolders(prev => prev.filter(folder => folder.id !== folderId))
          
          // Remove folderId from all chats that were in this folder
          setChats(prev => {
            const updatedChats = prev.map(chat => {
              if (chat.folderId === folderId) {
                return { ...chat, folderId: undefined }
              }
              return chat
            })
            return updatedChats
          })
        } catch (error) {
          console.error('Error deleting folder:', error)
        }
      }, 200) // Match the same timing as chat delete animation
    } catch (error) {
      console.error('Error deleting folder:', error)
      throw error
    }
  }, [animateFolderOperation])

  const moveChatToFolderHandler = React.useCallback(async (chatId: string, folderId?: string) => {
    try {
      // Start move animation
      animateChatOperation(chatId, 'move')
      
      // Update in database
      await moveChatToFolder(chatId, folderId || null)
      
      // Update local state
      setChats(prev => {
        const updatedChats = prev.map(chat => {
          if (chat.id === chatId) {
            return { ...chat, folderId }
          }
          return chat
        })
        return updatedChats
      })

      // Update folder's chatIds
      setFolders(prev => {
        return prev.map(folder => {
          if (folderId && folder.id === folderId) {
            // Add chat to target folder
            return addChatToFolder(folder, chatId)
          } else if (folder.chatIds.includes(chatId)) {
            // Remove chat from current folder
            return removeChatFromFolder(folder, chatId)
          }
          return folder
        })
      })
    } catch (error) {
      console.error('Error moving chat to folder:', error)
      throw error
    }
  }, [animateChatOperation])

  const value: ChatContextType = {
    currentChat,
    setCurrentChat,
    chats: nonEmptyChats, // Only expose non-empty chats
    setChats,
    folders,
    setFolders,
    isLoading,
    animatingChats,
    setAnimatingChats,
    animatingFolders,
    setAnimatingFolders,
    createChat: createChatHandler,
    addMessage,
    updateChat: updateChatHandler,
    deleteChat: deleteChatHandler,
    togglePin,
    createFolder: createFolderHandler,
    updateFolder: updateFolderHandler,
    deleteFolder: deleteFolderHandler,
    moveChatToFolder: moveChatToFolderHandler,
    animateChatOperation,
    onAnimationComplete,
    animateFolderOperation,
    onFolderAnimationComplete,
    generateAIResponse
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}
