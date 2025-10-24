import { createClient as createServerClient } from '@/lib/supabase/server'
import type { 
  Chat, 
  ChatInsert, 
  ChatUpdate, 
  Message, 
  MessageInsert, 
  Folder, 
  FolderInsert, 
  FolderUpdate,
  Tag,
  TagInsert,
  ChatTag,
} from '@/lib/types/database'

// Server-side database utilities
export class DatabaseServer {
  private async getSupabase() {
    return await createServerClient()
  }

  // Chat operations
  async getChats(userId: string, options?: {
    folderId?: string
    pinned?: boolean
    limit?: number
    offset?: number
  }) {
    const supabase = await this.getSupabase()
    
    let query = supabase
      .from('chats')
      .select(`
        *,
        messages:messages(*),
        chat_tags:chat_tags(
          tags:tags(*)
        )
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (options?.folderId) {
      query = query.eq('folder_id', options.folderId)
    }

    if (options?.pinned !== undefined) {
      query = query.eq('pinned', options.pinned)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) throw error
    return data as (Chat & {
      messages: Message[]
      chat_tags: Array<{
        tags: Tag
      }>
    })[]
  }

  async getChat(chatId: string) {
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('chats')
      .select(`
        *,
        messages:messages(*),
        chat_tags:chat_tags(
          tags:tags(*)
        )
      `)
      .eq('id', chatId)
      .single()

    if (error) throw error
    return data as Chat & {
      messages: Message[]
      chat_tags: Array<{
        tags: Tag
      }>
    }
  }

  async createChat(chatData: ChatInsert) {
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('chats')
      .insert(chatData)
      .select()
      .single()

    if (error) throw error
    return data as Chat
  }

  async updateChat(chatId: string, updates: ChatUpdate) {
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('chats')
      .update(updates)
      .eq('id', chatId)
      .select()
      .single()

    if (error) throw error
    return data as Chat
  }

  async deleteChat(chatId: string) {
    const supabase = await this.getSupabase()
    
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId)

    if (error) throw error
  }

  // Message operations
  async addMessage(messageData: MessageInsert) {
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single()

    if (error) throw error
    return data as Message
  }

  async getMessages(chatId: string) {
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data as Message[]
  }

  // Folder operations
  async getFolders(userId: string) {
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('folders')
      .select(`
        *,
        chats:chats(id)
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data as (Folder & {
      chats: { id: string }[]
    })[]
  }

  async createFolder(folderData: FolderInsert) {
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('folders')
      .insert(folderData)
      .select()
      .single()

    if (error) throw error
    return data as Folder
  }

  async updateFolder(folderId: string, updates: FolderUpdate) {
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('folders')
      .update(updates)
      .eq('id', folderId)
      .select()
      .single()

    if (error) throw error
    return data as Folder
  }

  async deleteFolder(folderId: string) {
    const supabase = await this.getSupabase()
    
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId)

    if (error) throw error
  }


  // Tag operations
  async getTags(userId: string) {
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', userId)
      .order('name')

    if (error) throw error
    return data as Tag[]
  }

  async createTag(tagData: TagInsert) {
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('tags')
      .insert(tagData)
      .select()
      .single()

    if (error) throw error
    return data as Tag
  }

  async updateTag(tagId: string, updates: { name: string }) {
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('tags')
      .update(updates)
      .eq('id', tagId)
      .select()
      .single()

    if (error) throw error
    return data as Tag
  }

  async deleteTag(tagId: string) {
    const supabase = await this.getSupabase()
    
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', tagId)

    if (error) throw error
  }

  // Chat-Tag relationship operations
  async addTagToChat(chatId: string, tagId: string) {
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('chat_tags')
      .insert({ chat_id: chatId, tag_id: tagId })
      .select()
      .single()

    if (error) throw error
    return data as ChatTag
  }

  async removeTagFromChat(chatId: string, tagId: string) {
    const supabase = await this.getSupabase()
    
    const { error } = await supabase
      .from('chat_tags')
      .delete()
      .eq('chat_id', chatId)
      .eq('tag_id', tagId)

    if (error) throw error
  }

  async getChatTags(chatId: string) {
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('chat_tags')
      .select(`
        *,
        tags:tags(*)
      `)
      .eq('chat_id', chatId)

    if (error) throw error
    return data as Array<{
      tags: Tag
    }>
  }
}

// Export singleton instance for server-side use
export const dbServer = new DatabaseServer()
