import { db } from '@/lib/database'
import type { FolderItem, CreateFolderData } from '@/lib/database'

// Re-export types for backward compatibility
export type { FolderItem, CreateFolderData }

// Real data functions using Supabase
export async function getFolders(userId: string): Promise<FolderItem[]> {
  try {
    const folders = await db.getFolders(userId)
    return folders.map(folder => ({
      id: folder.id,
      name: folder.name,
      description: folder.description || undefined,
      createdAt: folder.created_at || new Date().toISOString(),
      updatedAt: folder.updated_at || folder.created_at || new Date().toISOString(),
      chatIds: folder.chats?.map(c => c.id) || []
    }))
  } catch (error) {
    console.error('Error fetching folders:', error)
    return []
  }
}

export async function createFolder(userId: string, data: CreateFolderData): Promise<FolderItem> {
  try {
    const folder = await db.createFolder({
      name: data.name,
      description: data.description || null,
      user_id: userId
    })
    
    return {
      id: folder.id,
      name: folder.name,
      description: folder.description || undefined,
      createdAt: folder.created_at || new Date().toISOString(),
      updatedAt: folder.updated_at || folder.created_at || new Date().toISOString(),
      chatIds: []
    }
  } catch (error) {
    console.error('Error creating folder:', error)
    throw error
  }
}

export async function updateFolder(folderId: string, updates: Partial<FolderItem>): Promise<FolderItem> {
  try {
    const folder = await db.updateFolder(folderId, {
      name: updates.name,
      description: updates.description || null
    })
    
    return {
      id: folder.id,
      name: folder.name,
      description: folder.description || undefined,
      createdAt: folder.created_at || new Date().toISOString(),
      updatedAt: folder.updated_at || folder.created_at || new Date().toISOString(),
      chatIds: updates.chatIds || []
    }
  } catch (error) {
    console.error('Error updating folder:', error)
    throw error
  }
}

export async function deleteFolder(folderId: string): Promise<void> {
  try {
    await db.deleteFolder(folderId)
  } catch (error) {
    console.error('Error deleting folder:', error)
    throw error
  }
}

// Legacy mock data (kept for backward compatibility during transition)
export const folders: FolderItem[] = []

// Utility functions for folder management (client-side operations)
export const createNewFolder = (data: CreateFolderData): FolderItem => {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  
  return {
    id,
    name: data.name,
    description: data.description || "",
    createdAt: now,
    updatedAt: now,
    chatIds: []
  }
}

export const updateFolderItem = (folder: FolderItem, updates: Partial<FolderItem>): FolderItem => {
  return {
    ...folder,
    ...updates,
    updatedAt: new Date().toISOString()
  }
}

export const addChatToFolder = (folder: FolderItem, chatId: string): FolderItem => {
  if (folder.chatIds.includes(chatId)) {
    return folder
  }
  
  return {
    ...folder,
    chatIds: [...folder.chatIds, chatId],
    updatedAt: new Date().toISOString()
  }
}

export const removeChatFromFolder = (folder: FolderItem, chatId: string): FolderItem => {
  return {
    ...folder,
    chatIds: folder.chatIds.filter(id => id !== chatId),
    updatedAt: new Date().toISOString()
  }
}

export const moveChatBetweenFolders = (
  folders: FolderItem[], 
  chatId: string, 
  fromFolderId: string | undefined, 
  toFolderId: string | undefined
): FolderItem[] => {
  return folders.map(folder => {
    if (fromFolderId && folder.id === fromFolderId) {
      return removeChatFromFolder(folder, chatId)
    }
    if (toFolderId && folder.id === toFolderId) {
      return addChatToFolder(folder, chatId)
    }
    return folder
  })
}

// Database operations for moving chats between folders
export async function moveChatToFolder(chatId: string, folderId: string | null): Promise<void> {
  try {
    await db.updateChat(chatId, { folder_id: folderId })
  } catch (error) {
    console.error('Error moving chat to folder:', error)
    throw error
  }
}
