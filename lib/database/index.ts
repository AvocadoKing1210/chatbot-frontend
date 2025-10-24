// Database utilities and types
export * from './queries'
export * from './transformers'
export * from './connection-service'
export * from '../types/database'

// Re-export commonly used types for convenience
export type {
  Chat,
  ChatInsert,
  ChatUpdate,
  Message,
  MessageInsert,
  MessageUpdate,
  Folder,
  FolderInsert,
  FolderUpdate,
  Tag,
  TagInsert,
  TagUpdate,
  ChatTag,
  ChatTagInsert,
  ChatTagUpdate
} from '../types/database'

export type {
  ChatItem,
  MessageItem,
  FolderItem,
  UserProfile,
  TagItem
} from './transformers'

// Re-export interface types for backward compatibility
export interface CreateChatData {
  title?: string
  tags?: string[]
  mode: 'sql' | 'python'
  chartEnabled: boolean
  initialMessage?: string
  databaseConnectionId?: string
}

export interface CreateFolderData {
  name: string
  description?: string
}
