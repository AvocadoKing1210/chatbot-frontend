// Database connection service for managing external database connections

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
  private static readonly STORAGE_KEY = 'saved_database_connections'

  // Test database connection via API
  static async testConnection(connectionString: string): Promise<ConnectionTestResult> {
    try {
      const response = await fetch('/api/database/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connectionString }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        return {
          success: false,
          message: errorData.message || 'Connection test failed'
        }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Connection test error:', error)
      return {
        success: false,
        message: 'Network error. Please check your connection and try again.'
      }
    }
  }

  // Save connection to localStorage (in a real app, this would be stored securely on the server)
  static saveConnection(connection: Omit<SavedConnection, 'id' | 'lastTested'>): SavedConnection {
    const savedConnections = this.getSavedConnections()
    
    const newConnection: SavedConnection = {
      ...connection,
      id: crypto.randomUUID(),
      lastTested: new Date(),
    }

    savedConnections.push(newConnection)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(savedConnections))
    
    return newConnection
  }

  // Get all saved connections
  static getSavedConnections(): SavedConnection[] {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return []
      
      const connections = JSON.parse(stored)
      return connections.map((conn: any) => ({
        ...conn,
        lastTested: new Date(conn.lastTested)
      }))
    } catch (error) {
      console.error('Error loading saved connections:', error)
      return []
    }
  }

  // Delete a saved connection
  static deleteConnection(connectionId: string): void {
    if (typeof window === 'undefined') return
    
    const savedConnections = this.getSavedConnections()
    const filtered = savedConnections.filter(conn => conn.id !== connectionId)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered))
  }

  // Update connection validity status
  static updateConnectionStatus(connectionId: string, isValid: boolean, tableCount?: number): void {
    if (typeof window === 'undefined') return
    
    const savedConnections = this.getSavedConnections()
    const connection = savedConnections.find(conn => conn.id === connectionId)
    
    if (connection) {
      connection.isValid = isValid
      connection.lastTested = new Date()
      if (tableCount !== undefined) {
        connection.tableCount = tableCount
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(savedConnections))
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
    } catch (error) {
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
