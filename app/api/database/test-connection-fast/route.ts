import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { connectionString } = body
    
    console.log('Fast connection test with string:', connectionString.replace(/:[^:@]*@/, ':***@'))
    
    // Create a minimal connection pool for quick testing
    const pool = new Pool({
      connectionString,
      connectionTimeoutMillis: 15000, // 15 seconds for quick test
      idleTimeoutMillis: 5000,
      max: 1,
      allowExitOnIdle: true,
    })
    
    try {
      const client = await pool.connect()
      
      try {
        // Just test basic connectivity - no schema queries
        await client.query('SELECT 1 as test')
        console.log('Fast connection test successful')
        
        return NextResponse.json({
          success: true,
          message: 'Connection successful!',
          fastTest: true
        })
        
      } finally {
        client.release()
      }
      
    } catch (error) {
      console.error('Fast connection test error:', error)
      
      return NextResponse.json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        fastTest: true
      })
      
    } finally {
      await pool.end()
    }
    
  } catch (error) {
    console.error('Fast connection API error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'API error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      fastTest: true
    }, { status: 500 })
  }
}
