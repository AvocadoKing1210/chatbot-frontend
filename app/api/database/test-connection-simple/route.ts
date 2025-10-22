import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { connectionString } = body
    
    console.log('Testing connection with string:', connectionString.replace(/:[^:@]*@/, ':***@'))
    
    // Create a simple connection pool
    const pool = new Pool({
      connectionString,
      connectionTimeoutMillis: 5000,
      max: 1,
    })
    
    try {
      const client = await pool.connect()
      
      try {
        // Simple test query
        const result = await client.query('SELECT version()')
        console.log('Connection successful, PostgreSQL version:', result.rows[0].version)
        
        return NextResponse.json({
          success: true,
          message: 'Connection successful!',
          version: result.rows[0].version
        })
        
      } finally {
        client.release()
      }
      
    } catch (error) {
      console.error('Connection error:', error)
      
      return NextResponse.json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        errorType: error instanceof Error ? error.constructor.name : 'Unknown'
      })
      
    } finally {
      await pool.end()
    }
    
  } catch (error) {
    console.error('API error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'API error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 })
  }
}
