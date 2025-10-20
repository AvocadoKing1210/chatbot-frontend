import { db } from '@/lib/database'
import type { ChatItem, MessageItem, CreateChatData } from '@/lib/database'

// Re-export types for backward compatibility
export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: string
}

export type { ChatItem, CreateChatData }

// Utility function to set preview to title (simplified approach)
const getPreviewFromTitle = (title: string): string => {
  return title
}

// Real data functions using Supabase
export async function getChats(userId: string, options?: {
  folderId?: string
  pinned?: boolean
  limit?: number
  offset?: number
}): Promise<ChatItem[]> {
  try {
    const chats = await db.getChats(userId, options)
    return chats.map(chat => ({
      id: chat.id,
      title: chat.title,
      preview: chat.preview || '',
      updatedAt: chat.updated_at || chat.created_at || new Date().toISOString(),
      pinned: chat.pinned || false,
      folderId: chat.folder_id || undefined,
      tags: chat.chat_tags?.map(ct => ct.tags.name) || [],
      messages: chat.messages?.map(message => ({
        id: message.id,
        content: message.content,
        role: message.role as 'user' | 'assistant',
        timestamp: message.created_at || new Date().toISOString()
      })) || [],
      mode: (chat.mode as 'sql' | 'python') || 'sql',
      chartEnabled: chat.chart_enabled || false,
    }))
  } catch (error) {
    console.error('Error fetching chats:', error)
    return []
  }
}

export async function getPinnedChats(userId: string): Promise<ChatItem[]> {
  return getChats(userId, { pinned: true })
}

export async function getRecentChats(userId: string, limit: number = 10): Promise<ChatItem[]> {
  return getChats(userId, { limit })
}

export async function getChat(chatId: string): Promise<ChatItem | null> {
  try {
    const chat = await db.getChat(chatId)
    return {
      id: chat.id,
      title: chat.title,
      preview: chat.preview || '',
      updatedAt: chat.updated_at || chat.created_at || new Date().toISOString(),
      pinned: chat.pinned || false,
      folderId: chat.folder_id || undefined,
      tags: chat.chat_tags?.map(ct => ct.tags.name) || [],
      messages: chat.messages?.map(message => ({
        id: message.id,
        content: message.content,
        role: message.role as 'user' | 'assistant',
        timestamp: message.created_at || new Date().toISOString()
      })) || [],
      mode: (chat.mode as 'sql' | 'python') || 'sql',
      chartEnabled: chat.chart_enabled || false,
    }
  } catch (error) {
    console.error('Error fetching chat:', error)
    return null
  }
}

export async function createChat(userId: string, data: CreateChatData): Promise<ChatItem> {
  try {
    const title = data.title || 'New Chat'
    const chat = await db.createChat({
      title,
      preview: getPreviewFromTitle(title),
      mode: data.mode,
      chart_enabled: data.chartEnabled,
      user_id: userId
    })
    
    // Add initial message if provided
    if (data.initialMessage) {
      await db.addMessage({
        chat_id: chat.id,
        content: data.initialMessage,
        role: 'user'
      })
    }
    
    // Add tags if provided
    if (data.tags && data.tags.length > 0) {
      for (const tagName of data.tags) {
        // Get or create tag
        const tags = await db.getTags(userId)
        let tag = tags.find(t => t.name === tagName)
        
        if (!tag) {
          tag = await db.createTag({
            name: tagName,
            user_id: userId
          })
        }
        
        await db.addTagToChat(chat.id, tag.id)
      }
    }
    
    return {
      id: chat.id,
      title: chat.title,
      preview: chat.preview || '',
      updatedAt: chat.updated_at || chat.created_at || new Date().toISOString(),
      pinned: chat.pinned || false,
      folderId: chat.folder_id || undefined,
      tags: data.tags || [],
      messages: data.initialMessage ? [{
        id: crypto.randomUUID(),
        content: data.initialMessage,
        role: 'user',
        timestamp: new Date().toISOString()
      }] : [],
      mode: (chat.mode as 'sql' | 'python') || 'sql',
      chartEnabled: chat.chart_enabled || false,
    }
  } catch (error) {
    console.error('Error creating chat:', error)
    throw error
  }
}

export async function updateChat(chatId: string, updates: Partial<ChatItem>): Promise<ChatItem> {
  try {
    const chat = await db.updateChat(chatId, {
      title: updates.title,
      preview: updates.title ? getPreviewFromTitle(updates.title) : undefined,
      pinned: updates.pinned,
      folder_id: updates.folderId || null,
      mode: updates.mode,
      chart_enabled: updates.chartEnabled
    })
    
    return {
      id: chat.id,
      title: chat.title,
      preview: chat.preview || '',
      updatedAt: chat.updated_at || chat.created_at || new Date().toISOString(),
      pinned: chat.pinned || false,
      folderId: chat.folder_id || undefined,
      tags: updates.tags || [],
      messages: updates.messages || [],
      mode: (chat.mode as 'sql' | 'python') || 'sql',
      chartEnabled: chat.chart_enabled || false,
    }
  } catch (error) {
    console.error('Error updating chat:', error)
    throw error
  }
}

export async function deleteChat(chatId: string): Promise<void> {
  try {
    await db.deleteChat(chatId)
  } catch (error) {
    console.error('Error deleting chat:', error)
    throw error
  }
}

export async function addMessageToChatDB(chatId: string, content: string, role: 'user' | 'assistant'): Promise<Message> {
  try {
    const message = await db.addMessage({
      chat_id: chatId,
      content,
      role
    })
    
    return {
      id: message.id,
      content: message.content,
      role: message.role as 'user' | 'assistant',
      timestamp: message.created_at || new Date().toISOString()
    }
  } catch (error) {
    console.error('Error adding message to chat:', error)
    throw error
  }
}

export async function getMessages(chatId: string): Promise<Message[]> {
  try {
    const messages = await db.getMessages(chatId)
    return messages.map(message => ({
      id: message.id,
      content: message.content,
      role: message.role as 'user' | 'assistant',
      timestamp: message.created_at || new Date().toISOString()
    }))
  } catch (error) {
    console.error('Error fetching messages:', error)
    return []
  }
}

// Legacy mock data (kept for backward compatibility during transition)
export const pinnedChats: ChatItem[] = []
export const recentChats: ChatItem[] = []

// Utility functions for chat management (client-side operations)
export const createNewChatItem = (data: CreateChatData): ChatItem => {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  
  return {
    id,
    title: data.title || "New Chat",
    preview: data.initialMessage || "New conversation started",
    updatedAt: now,
    tags: data.tags || [],
    mode: data.mode,
    chartEnabled: data.chartEnabled,
    messages: data.initialMessage ? [
      {
        id: crypto.randomUUID(),
        content: data.initialMessage,
        role: "user",
        timestamp: now
      }
    ] : []
  }
}

export const addMessageToChatItem = (chat: ChatItem, content: string, role: 'user' | 'assistant'): ChatItem => {
  const newMessage: Message = {
    id: crypto.randomUUID(),
    content,
    role,
    timestamp: new Date().toISOString()
  }
  
  return {
    ...chat,
    messages: [...chat.messages, newMessage],
    updatedAt: new Date().toISOString(),
    preview: content.length > 50 ? content.substring(0, 50) + "..." : content
  }
}

export const updateChatTitle = (chat: ChatItem, title: string): ChatItem => {
  return {
    ...chat,
    title,
    updatedAt: new Date().toISOString()
  }
}

export const updateChatTags = (chat: ChatItem, tags: string[]): ChatItem => {
  return {
    ...chat,
    tags,
    updatedAt: new Date().toISOString()
  }
}

// Database operations for updating chat tags
export async function updateChatTagsInDB(chatId: string, userId: string, tags: string[]): Promise<void> {
  try {
    // Get current chat tags
    const currentTags = await db.getChatTags(chatId)
    
    // Remove all current tags
    for (const currentTag of currentTags) {
      await db.removeTagFromChat(chatId, currentTag.tags.id)
    }
    
    // Add new tags
    for (const tagName of tags) {
      // Get or create tag
      const userTags = await db.getTags(userId)
      let tag = userTags.find(t => t.name === tagName)
      
      if (!tag) {
        tag = await db.createTag({
          name: tagName,
          user_id: userId
        })
      }
      
      await db.addTagToChat(chatId, tag.id)
    }
  } catch (error) {
    console.error('Error updating chat tags:', error)
    throw error
  }
}

// Legacy function exports for backward compatibility
export const createNewChat = createNewChatItem
export const addMessageToChat = addMessageToChatItem
