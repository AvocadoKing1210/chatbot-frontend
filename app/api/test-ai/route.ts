import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/lib/ai/ai-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, mode = 'general', context } = body

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    let response: string
    switch (mode) {
      case 'sql':
        response = await aiService.generateSQLQuery(prompt, context)
        break
      case 'python':
        response = await aiService.generatePythonScript(prompt, context)
        break
      default:
        response = await aiService.generateGeneralResponse(prompt, context)
    }

    return NextResponse.json({
      success: true,
      response,
      mode,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('AI API Error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Test API is running',
    endpoint: 'POST /api/test-ai',
    parameters: {
      prompt: 'string (required)',
      mode: 'sql | python | general (optional, default: general)',
      context: 'string (optional)'
    },
    examples: {
      sql: {
        prompt: 'Show me bike sharing usage on rainy days',
        mode: 'sql'
      },
      python: {
        prompt: 'Create a function to calculate fibonacci numbers',
        mode: 'python'
      },
      general: {
        prompt: 'Explain how machine learning works',
        mode: 'general'
      }
    }
  })
}
