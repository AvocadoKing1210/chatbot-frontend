import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

interface ExecuteQueryRequest {
  connectionString: string
  query: string
}

interface QueryResult {
  status: 'ok' | 'error'
  meta: {
    full: boolean
    effectiveLimit: number
    wasClamped: boolean
  }
  query_id: number
  columns: Array<{
    name: string
    type: string
  }>
  data: Array<Record<string, unknown>>
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

export async function POST(request: NextRequest) {
  try {
    const body: ExecuteQueryRequest = await request.json()
    const { connectionString, query } = body
    
    // Validate input
    if (!connectionString || typeof connectionString !== 'string') {
      return NextResponse.json({
        status: 'error',
        message: 'Connection string is required'
      }, { status: 400 })
    }

    if (!query || typeof query !== 'string') {
      return NextResponse.json({
        status: 'error',
        message: 'Query is required'
      }, { status: 400 })
    }
    
    // Validate connection string format
    if (!validateConnectionString(connectionString)) {
      return NextResponse.json({
        status: 'error',
        message: 'Invalid connection string format. Must be a valid PostgreSQL URL.'
      }, { status: 400 })
    }
    
    // Create connection pool
    const pool = new Pool({
      connectionString,
      connectionTimeoutMillis: 30000,
      idleTimeoutMillis: 10000,
      max: 1,
      allowExitOnIdle: true,
      keepAlive: true,
      keepAliveInitialDelayMillis: 0,
    })
    
    let result: QueryResult
    
    try {
      // Execute query
      const client = await pool.connect()
      
      try {
        console.log(`Executing query: ${query.substring(0, 100)}...`)
        const queryResult = await client.query(query)
        
        // Extract column information
        const columns = queryResult.fields.map(field => ({
          name: field.name,
          type: field.dataTypeID ? getDataTypeName(field.dataTypeID) : 'unknown'
        }))
        
        // Convert rows to objects
        const data = queryResult.rows.map(row => {
          const obj: Record<string, unknown> = {}
          queryResult.fields.forEach(field => {
            obj[field.name] = row[field.name]
          })
          return obj
        })
        
        result = {
          status: 'ok',
          meta: {
            full: true,
            effectiveLimit: data.length,
            wasClamped: false
          },
          query_id: Date.now(), // Simple ID generation
          columns,
          data
        }
        
      } finally {
        client.release()
      }
      
    } catch (error) {
      console.error('Query execution error:', error)
      
      let errorMessage = 'Query execution failed. Please check your query syntax and try again.'
      
      if (error instanceof Error) {
        if (error.message.includes('syntax error')) {
          errorMessage = `SQL syntax error: ${error.message}`
        } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
          errorMessage = `Table or view does not exist: ${error.message}`
        } else if (error.message.includes('column') && error.message.includes('does not exist')) {
          errorMessage = `Column does not exist: ${error.message}`
        } else if (error.message.includes('permission denied')) {
          errorMessage = `Permission denied: ${error.message}`
        } else {
          errorMessage = error.message
        }
      }
      
      return NextResponse.json({
        status: 'error',
        message: errorMessage
      }, { status: 400 })
    } finally {
      // Always close the pool
      await pool.end()
    }
    
    // Log the query execution (with sanitized connection string)
    console.log(`Query executed successfully: ${sanitizeConnectionString(connectionString)} - ${result.data.length} rows returned`)
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('API error:', error)
    
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error. Please try again later.'
    }, { status: 500 })
  }
}

// Map PostgreSQL data type IDs to readable names
function getDataTypeName(dataTypeID: number): string {
  const typeMap: Record<number, string> = {
    16: 'BOOLEAN',
    17: 'BYTEA',
    20: 'BIGINT',
    21: 'SMALLINT',
    23: 'INTEGER',
    25: 'TEXT',
    700: 'REAL',
    701: 'DOUBLE PRECISION',
    1043: 'VARCHAR',
    1082: 'DATE',
    1114: 'TIMESTAMP',
    1184: 'TIMESTAMPTZ',
    1700: 'NUMERIC',
    2950: 'UUID'
  }
  
  return typeMap[dataTypeID] || 'UNKNOWN'
}
