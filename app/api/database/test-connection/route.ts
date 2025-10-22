import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

interface ConnectionTestRequest {
  connectionString: string
}

interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
}

interface TableInfo {
  name: string
  columns: ColumnInfo[]
  rowCount: number
}

interface ConnectionTestResult {
  success: boolean
  message: string
  tables?: TableInfo[]
}

// Validate connection string format
function validateConnectionString(connectionString: string): boolean {
  try {
    const url = new URL(connectionString)
    return url.protocol === 'postgresql:' || url.protocol === 'postgres:'
  } catch {
    return false
  }
}

// Sanitize connection string for logging (remove password)
function sanitizeConnectionString(connectionString: string): string {
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

// Get table schema information using existing client
async function getTableSchemaWithClient(client: any): Promise<TableInfo[]> {
  // Get all tables in the public schema
  const tablesQuery = `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
    LIMIT 20
  `
  
  const tablesResult = await client.query(tablesQuery)
  const tables: TableInfo[] = []
  
  for (const table of tablesResult.rows) {
    const tableName = table.table_name
    
    // Get column information
    const columnsQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = $1
      ORDER BY ordinal_position
    `
    
    const columnsResult = await client.query(columnsQuery, [tableName])
    
    // Get row count
    const countQuery = `SELECT COUNT(*) as count FROM "${tableName}"`
    const countResult = await client.query(countQuery)
    
    const columns: ColumnInfo[] = columnsResult.rows.map(row => ({
      name: row.column_name,
      type: row.character_maximum_length 
        ? `${row.data_type}(${row.character_maximum_length})`
        : row.data_type,
      nullable: row.is_nullable === 'YES'
    }))
    
    tables.push({
      name: tableName,
      columns,
      rowCount: parseInt(countResult.rows[0].count)
    })
  }
  
  return tables
}

export async function POST(request: NextRequest) {
  try {
    const body: ConnectionTestRequest = await request.json()
    const { connectionString } = body
    
    // Validate input
    if (!connectionString || typeof connectionString !== 'string') {
      return NextResponse.json({
        success: false,
        message: 'Connection string is required'
      }, { status: 400 })
    }
    
    // Validate connection string format
    if (!validateConnectionString(connectionString)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid connection string format. Must be a valid PostgreSQL URL.'
      }, { status: 400 })
    }
    
    // Create connection pool
    const pool = new Pool({
      connectionString,
      // Set reasonable timeouts - increased for Supabase
      connectionTimeoutMillis: 30000, // 30 seconds for Supabase
      idleTimeoutMillis: 30000,
      max: 1, // Only need one connection for testing
    })
    
    let result: ConnectionTestResult
    
    try {
      // Test connection
      const client = await pool.connect()
      
      try {
        // Simple query to test connection
        await client.query('SELECT 1')
        
        // Get database schema using the same client
        const tables = await getTableSchemaWithClient(client)
        
        result = {
          success: true,
          message: `Connection successful! Found ${tables.length} tables in the database.`,
          tables
        }
        
      } finally {
        client.release()
      }
      
    } catch (error) {
      console.error('Database connection error:', error)
      
      let errorMessage = 'Connection failed. Please check your connection string and try again.'
      let detailedError = ''
      
      if (error instanceof Error) {
        detailedError = error.message
        
        if (error.message.includes('ECONNREFUSED')) {
          errorMessage = 'Connection refused. Please check if the database server is running and accessible.'
        } else if (error.message.includes('authentication failed')) {
          errorMessage = 'Authentication failed. Please check your username and password.'
        } else if (error.message.includes('database') && error.message.includes('does not exist')) {
          errorMessage = 'Database does not exist. Please check the database name in your connection string.'
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Connection timeout. Please check your network connection and database server status.'
        } else if (error.message.includes('ENOTFOUND')) {
          errorMessage = 'Host not found. Please check the hostname in your connection string.'
        } else if (error.message.includes('ETIMEDOUT')) {
          errorMessage = 'Connection timed out. Please check your network connection and firewall settings.'
        }
      }
      
      result = {
        success: false,
        message: errorMessage,
        // Include detailed error for debugging (remove in production)
        ...(process.env.NODE_ENV === 'development' && { detailedError })
      }
    } finally {
      // Always close the pool
      await pool.end()
    }
    
    // Log the connection attempt (with sanitized connection string)
    console.log(`Database connection test: ${result.success ? 'SUCCESS' : 'FAILED'} - ${sanitizeConnectionString(connectionString)}`)
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('API error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error. Please try again later.'
    }, { status: 500 })
  }
}
