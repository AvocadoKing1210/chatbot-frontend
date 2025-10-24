// Database connection service for managing external database connections
import { createClient } from '@/lib/supabase/client'
import { encryptConnectionString, decryptConnectionString } from '@/lib/encryption'
import type { UserDatabaseConnection, UserDatabaseConnectionInsert, UserDatabaseConnectionUpdate } from '@/lib/types/database'

export interface ConnectionTestResult {
  success: boolean
  message: string
  detailedError?: string
  tables?: Array<{
    name: string
    columns: Array<{
      name: string
      type: string
      nullable: boolean
    }>
    rowCount: number
  }>
}

export interface SavedConnection {
  id: string
  name: string
  connectionString: string
  lastTested: Date
  isValid: boolean
  tableCount?: number
}

export class DatabaseConnectionService {
  private static supabase = createClient()

  // Test database connection via API with retry logic for cold starts
  static async testConnection(connectionString: string): Promise<ConnectionTestResult> {
    console.log('Starting database connection test...')
    
    // First, try a fast connection test to warm up the serverless function
    try {
      console.log('Attempting fast connection test...')
      const fastResponse = await fetch('/api/database/test-connection-fast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connectionString }),
      })

      if (fastResponse.ok) {
        const fastResult = await fastResponse.json()
        if (fastResult.success) {
          console.log('Fast connection test successful, proceeding with full test...')
        }
      }
    } catch (error) {
      console.log('Fast connection test failed, proceeding with full test...', error)
    }

    // Now do the full connection test with retry logic
    const maxRetries = 3
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Full connection test attempt ${attempt}/${maxRetries}`)
        
        // Add timeout to fetch request to prevent hanging
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 50000) // 50 second timeout
        
        const response = await fetch('/api/database/test-connection', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ connectionString }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorData = await response.json()
          const error = new Error(errorData.message || 'Connection test failed')
          
          // More comprehensive retry conditions
          const shouldRetry = attempt < maxRetries && (
            errorData.message?.includes('timeout') || 
            errorData.message?.includes('Connection failed') ||
            errorData.message?.includes('Connection timeout') ||
            errorData.message?.includes('ETIMEDOUT') ||
            errorData.message?.includes('ECONNREFUSED') ||
            response.status === 500 ||
            response.status === 504 || // Gateway timeout
            response.status === 408    // Request timeout
          )
          
          if (shouldRetry) {
            const delay = attempt * 2000 // Exponential backoff: 2s, 4s, 6s
            console.log(`Attempt ${attempt} failed (${response.status}), retrying in ${delay/1000} seconds...`)
            await new Promise(resolve => setTimeout(resolve, delay))
            lastError = error
            continue
          }
          
          return {
            success: false,
            message: errorData.message || 'Connection test failed',
            detailedError: errorData.detailedError
          }
        }

        const result = await response.json()
        console.log(`Full connection test successful on attempt ${attempt}`)
        return result
      } catch (error) {
        console.error(`Full connection test error on attempt ${attempt}:`, error)
        lastError = error as Error
        
        // Check if it's an abort error (timeout) or network error
        const isTimeoutOrNetworkError = error instanceof Error && (
          error.name === 'AbortError' ||
          error.message.includes('fetch') ||
          error.message.includes('network') ||
          error.message.includes('timeout')
        )
        
        if (attempt < maxRetries && isTimeoutOrNetworkError) {
          const delay = attempt * 2000 // Exponential backoff
          console.log(`Attempt ${attempt} failed (network/timeout), retrying in ${delay/1000} seconds...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
      }
    }

    // All attempts failed
    return {
      success: false,
      message: lastError?.message || 'Network error. Please check your connection and try again.'
    }
  }

  // Get current user ID
  private static async getCurrentUserId(): Promise<string> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')
    return user.id
  }

  // Save connection to Supabase (encrypted)
  static async saveConnection(connection: Omit<SavedConnection, 'id' | 'lastTested'>): Promise<SavedConnection> {
    try {
      const userId = await this.getCurrentUserId()
      const connectionId = crypto.randomUUID()
      
      // Encrypt the connection string
      const encryptedConnectionString = await encryptConnectionString(connection.connectionString, userId)
      
      const connectionData: UserDatabaseConnectionInsert = {
        id: connectionId,
        user_id: userId,
        name: connection.name,
        connection_string: encryptedConnectionString,
        is_valid: connection.isValid,
        table_count: connection.tableCount || 0,
        last_tested: new Date().toISOString()
      }

      const { error } = await this.supabase
        .from('user_database_connections')
        .insert(connectionData)

      if (error) throw error

      return {
        id: connectionId,
        name: connection.name,
        connectionString: connection.connectionString,
        lastTested: new Date(),
        isValid: connection.isValid,
        tableCount: connection.tableCount
      }
    } catch (error) {
      console.error('Error saving connection:', error)
      throw error
    }
  }

  // Get all saved connections from Supabase (decrypted)
  static async getSavedConnections(): Promise<SavedConnection[]> {
    try {
      const userId = await this.getCurrentUserId()
      
      const { data, error } = await this.supabase
        .from('user_database_connections')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Decrypt connection strings
      const decryptedConnections = await Promise.all(
        (data || []).map(async (conn: UserDatabaseConnection) => {
          try {
            const decryptedConnectionString = await decryptConnectionString(conn.connection_string, userId)
            return {
              id: conn.id,
              name: conn.name,
              connectionString: decryptedConnectionString,
              lastTested: new Date(conn.last_tested || conn.created_at || new Date()),
              isValid: conn.is_valid || false,
              tableCount: conn.table_count || 0
            }
          } catch (decryptError) {
            console.error('Failed to decrypt connection:', conn.id, decryptError)
            // Return connection with placeholder string if decryption fails
            return {
              id: conn.id,
              name: conn.name,
              connectionString: '[Encrypted - Decryption Failed]',
              lastTested: new Date(conn.last_tested || conn.created_at || new Date()),
              isValid: false,
              tableCount: conn.table_count || 0
            }
          }
        })
      )

      return decryptedConnections
    } catch (error) {
      console.error('Error loading saved connections:', error)
      return []
    }
  }

  // Delete a saved connection from Supabase
  static async deleteConnection(connectionId: string): Promise<void> {
    try {
      const userId = await this.getCurrentUserId()
      
      const { error } = await this.supabase
        .from('user_database_connections')
        .delete()
        .eq('id', connectionId)
        .eq('user_id', userId)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting connection:', error)
      throw error
    }
  }

  // Update connection validity status in Supabase
  static async updateConnectionStatus(connectionId: string, isValid: boolean, tableCount?: number): Promise<void> {
    try {
      const userId = await this.getCurrentUserId()
      
      const updateData: UserDatabaseConnectionUpdate = {
        is_valid: isValid,
        last_tested: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      if (tableCount !== undefined) {
        updateData.table_count = tableCount
      }

      const { error } = await this.supabase
        .from('user_database_connections')
        .update(updateData)
        .eq('id', connectionId)
        .eq('user_id', userId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating connection status:', error)
      throw error
    }
  }

  // Update a saved connection in Supabase
  static async updateConnection(connectionId: string, updates: Partial<SavedConnection>): Promise<SavedConnection | null> {
    try {
      const userId = await this.getCurrentUserId()
      
      // Prepare update data
      const updateData: UserDatabaseConnectionUpdate = {
        name: updates.name,
        is_valid: updates.isValid,
        table_count: updates.tableCount,
        last_tested: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // If connection string is being updated, encrypt it
      if (updates.connectionString) {
        updateData.connection_string = await encryptConnectionString(updates.connectionString, userId)
      }

      const { data, error } = await this.supabase
        .from('user_database_connections')
        .update(updateData)
        .eq('id', connectionId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      if (!data) return null

      // Decrypt the connection string for return
      const decryptedConnectionString = await decryptConnectionString(data.connection_string, userId)

      return {
        id: data.id,
        name: data.name,
        connectionString: decryptedConnectionString,
        lastTested: new Date(data.last_tested || data.created_at || new Date()),
        isValid: data.is_valid || false,
        tableCount: data.table_count || 0
      }
    } catch (error) {
      console.error('Error updating connection:', error)
      return null
    }
  }

  // Migrate localStorage connections to Supabase (one-time migration)
  static async migrateFromLocalStorage(): Promise<void> {
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem('saved_database_connections')
      if (!stored) return

      const localConnections = JSON.parse(stored)
      if (!Array.isArray(localConnections) || localConnections.length === 0) return

      console.log(`Migrating ${localConnections.length} connections from localStorage to Supabase...`)

      // Migrate each connection
      for (const conn of localConnections) {
        try {
          await this.saveConnection({
            name: conn.name,
            connectionString: conn.connectionString,
            isValid: conn.isValid || false,
            tableCount: conn.tableCount || 0
          })
        } catch (error) {
          console.error('Failed to migrate connection:', conn.name, error)
        }
      }

      // Clear localStorage after successful migration
      localStorage.removeItem('saved_database_connections')
      console.log('Migration completed successfully')
    } catch (error) {
      console.error('Error during migration:', error)
    }
  }

  // Validate connection string format
  static validateConnectionString(connectionString: string): { isValid: boolean; error?: string } {
    if (!connectionString.trim()) {
      return { isValid: false, error: 'Connection string is required' }
    }

    try {
      const url = new URL(connectionString)
      
      if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
        return { isValid: false, error: 'Only PostgreSQL connections are supported' }
      }

      if (!url.hostname) {
        return { isValid: false, error: 'Hostname is required' }
      }

      if (!url.pathname || url.pathname === '/') {
        return { isValid: false, error: 'Database name is required' }
      }

      return { isValid: true }
    } catch {
      return { isValid: false, error: 'Invalid connection string format' }
    }
  }

  // Sanitize connection string for display (remove password)
  static sanitizeConnectionString(connectionString: string): string {
    try {
      const url = new URL(connectionString)
      if (url.password) {
        url.password = '***'
      }
      return url.toString()
    } catch {
      return 'invalid-connection-string'
    }
  }

  // Extract database name from connection string
  static extractDatabaseName(connectionString: string): string | null {
    try {
      const url = new URL(connectionString)
      return url.pathname.slice(1) || null
    } catch {
      return null
    }
  }

  // Extract hostname from connection string
  static extractHostname(connectionString: string): string | null {
    try {
      const url = new URL(connectionString)
      return url.hostname
    } catch {
      return null
    }
  }
}