import type { 
  Chat, 
  Message, 
  Folder, 
  Tag 
} from '@/lib/types/database'

// Transform database types to app types
export interface ChatItem {
  id: string
  title: string
  preview: string
  updatedAt: string
  pinned?: boolean
  folderId?: string
  tags?: string[]
  messages: MessageItem[]
  mode: 'sql' | 'python'
  chartEnabled: boolean
  databaseConnectionId?: string
}

export interface MessageItem {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: string
}

export interface FolderItem {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  chatIds: string[]
}

export interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  workspace?: string
}

export interface TagItem {
  id: string
  name: string
  createdAt: string
}

// Transform database chat to app chat
export function transformChatToChatItem(
  chat: Chat & {
    messages: Message[]
    chat_tags: Array<{
      tags: Tag
    }>
  }
): ChatItem {
  return {
    id: chat.id,
    title: chat.title,
    preview: chat.preview || '',
    updatedAt: chat.updated_at || chat.created_at || new Date().toISOString(),
    pinned: chat.pinned || false,
    folderId: chat.folder_id || undefined,
    tags: chat.chat_tags?.map(ct => ct.tags.name) || [],
    messages: chat.messages?.map(transformMessageToMessageItem) || [],
    mode: (chat.mode as 'sql' | 'python') || 'sql',
    chartEnabled: chat.chart_enabled || false,
    databaseConnectionId: chat.database_connection_id || undefined,
  }
}

// Transform database message to app message
export function transformMessageToMessageItem(message: Message): MessageItem {
  return {
    id: message.id,
    content: message.content,
    role: message.role as 'user' | 'assistant',
    timestamp: message.created_at || new Date().toISOString(),
  }
}

// Transform database folder to app folder
export function transformFolderToFolderItem(
  folder: Folder & {
    chats: { id: string }[]
  }
): FolderItem {
  return {
    id: folder.id,
    name: folder.name,
    description: folder.description || undefined,
    createdAt: folder.created_at || new Date().toISOString(),
    updatedAt: folder.updated_at || folder.created_at || new Date().toISOString(),
    chatIds: folder.chats?.map(c => c.id) || [],
  }
}


// Transform database tag to app tag
export function transformTagToTagItem(tag: Tag): TagItem {
  return {
    id: tag.id,
    name: tag.name,
    createdAt: tag.created_at || new Date().toISOString(),
  }
}

// Transform app chat to database chat
export function transformChatItemToChat(chatItem: ChatItem, userId: string) {
  return {
    id: chatItem.id,
    title: chatItem.title,
    preview: chatItem.preview,
    pinned: chatItem.pinned || false,
    folder_id: chatItem.folderId || null,
    mode: chatItem.mode,
    chart_enabled: chatItem.chartEnabled,
    user_id: userId,
  }
}

// Transform app message to database message
export function transformMessageItemToMessage(messageItem: MessageItem, chatId: string) {
  return {
    id: messageItem.id,
    content: messageItem.content,
    role: messageItem.role,
    chat_id: chatId,
  }
}

// Transform app folder to database folder
export function transformFolderItemToFolder(folderItem: FolderItem, userId: string) {
  return {
    id: folderItem.id,
    name: folderItem.name,
    description: folderItem.description || null,
    user_id: userId,
  }
}


// Transform app tag to database tag
export function transformTagItemToTag(tagItem: TagItem, userId: string) {
  return {
    id: tagItem.id,
    name: tagItem.name,
    user_id: userId,
  }
}

// Utility functions for data manipulation
export function createNewChatItem(data: {
  title?: string
  tags?: string[]
  mode: 'sql' | 'python'
  chartEnabled: boolean
  initialMessage?: string
  databaseConnectionId?: string
}): ChatItem {
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
    databaseConnectionId: data.databaseConnectionId,
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

export function addMessageToChatItem(chat: ChatItem, content: string, role: 'user' | 'assistant'): ChatItem {
  const newMessage: MessageItem = {
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

export function updateChatItemTitle(chat: ChatItem, title: string): ChatItem {
  return {
    ...chat,
    title,
    updatedAt: new Date().toISOString()
  }
}

export function updateChatItemTags(chat: ChatItem, tags: string[]): ChatItem {
  return {
    ...chat,
    tags,
    updatedAt: new Date().toISOString()
  }
}

export function createNewFolderItem(data: {
  name: string
  description?: string
}): FolderItem {
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

export function updateFolderItem(folder: FolderItem, updates: Partial<FolderItem>): FolderItem {
  return {
    ...folder,
    ...updates,
    updatedAt: new Date().toISOString()
  }
}

export function addChatToFolderItem(folder: FolderItem, chatId: string): FolderItem {
  if (folder.chatIds.includes(chatId)) {
    return folder
  }
  
  return {
    ...folder,
    chatIds: [...folder.chatIds, chatId],
    updatedAt: new Date().toISOString()
  }
}

export function removeChatFromFolderItem(folder: FolderItem, chatId: string): FolderItem {
  return {
    ...folder,
    chatIds: folder.chatIds.filter(id => id !== chatId),
    updatedAt: new Date().toISOString()
  }
}

export function moveChatBetweenFolderItems(
  folders: FolderItem[], 
  chatId: string, 
  fromFolderId: string | undefined, 
  toFolderId: string | undefined
): FolderItem[] {
  return folders.map(folder => {
    if (fromFolderId && folder.id === fromFolderId) {
      return removeChatFromFolderItem(folder, chatId)
    }
    if (toFolderId && folder.id === toFolderId) {
      return addChatToFolderItem(folder, chatId)
    }
    return folder
  })
}
