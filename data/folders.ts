export interface FolderItem {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  chatIds: string[]
}

export interface CreateFolderData {
  name: string
  description?: string
}

// Mock data for demo
export const folders: FolderItem[] = [
  { 
    id: "1", 
    name: "Work Projects", 
    description: "Professional development and work-related conversations",
    createdAt: "2024-01-10T09:00:00Z",
    updatedAt: "2024-01-15T14:30:00Z",
    chatIds: ["1", "6", "7"]
  },
  { 
    id: "2", 
    name: "Personal", 
    description: "Personal projects and learning",
    createdAt: "2024-01-12T10:15:00Z",
    updatedAt: "2024-01-14T16:45:00Z",
    chatIds: ["2", "3"]
  },
  { 
    id: "3", 
    name: "Code Reviews", 
    description: "Code review discussions and feedback",
    createdAt: "2024-01-08T11:30:00Z",
    updatedAt: "2024-01-13T09:20:00Z",
    chatIds: ["4", "5"]
  },
]

// Utility functions for folder management
export const createNewFolder = (data: CreateFolderData): FolderItem => {
  const id = Date.now().toString()
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

export const updateFolder = (folder: FolderItem, updates: Partial<FolderItem>): FolderItem => {
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
