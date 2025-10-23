/**
 * AI Service for integrating with a custom AI endpoint
 * Provides a clean interface for making AI requests with proper error handling
 * 
 * Required Environment Variable:
 * - NEXT_PUBLIC_AI_ENDPOINT: The URL of your AI service endpoint
 * 
 * Example:
 * NEXT_PUBLIC_AI_ENDPOINT=https://your-ai-service.com/api/generate
 */

export interface AIRequest {
  prompt: string
  use_rag?: boolean
  max_tokens?: number
  temperature?: number
  system_prompt?: string
  context?: string
}

export interface AIResponse {
  success: boolean
  response: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  processing_time_ms?: number
  sql_metadata?: {
    is_sql_query: boolean
    query_type: string
    estimated_complexity: string
  }
  rag_metadata?: {
    rag_enabled: boolean
    context_retrieved: boolean
    search_metadata?: {
      results_count: number
      search_query: string
      sources: Array<{
        score: number
        file_id: string
        filename: string
      }>
    }
    context_sources: number
  }
  gateway_metadata?: {
    model: string
    timestamp: string
    request_id: string
    gateway_id: string
  }
}

export interface AIError {
  success: false
  error: string
}

export class AIService {
  private static instance: AIService
  private abortController: AbortController | null = null

  private constructor() {
    // Validate endpoint configuration
    const aiEndpoint = process.env.NEXT_PUBLIC_AI_ENDPOINT
    
    if (!aiEndpoint) {
      throw new Error('AI endpoint is not configured. Please set NEXT_PUBLIC_AI_ENDPOINT environment variable.')
    }
    
    if (!aiEndpoint.startsWith('http')) {
      throw new Error('AI endpoint must be a valid HTTP/HTTPS URL')
    }
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService()
    }
    return AIService.instance
  }

  /**
   * Make a request to the AI endpoint
   */
  async generateResponse(request: AIRequest): Promise<AIResponse> {
    const aiEndpoint = process.env.NEXT_PUBLIC_AI_ENDPOINT
    
    if (!aiEndpoint) {
      throw new Error('AI endpoint is not configured. Please set NEXT_PUBLIC_AI_ENDPOINT environment variable.')
    }

    // Create a new abort controller for this specific request
    const abortController = new AbortController()
    
    // Store the current request's abort controller
    this.abortController = abortController

    try {
      const response = await fetch(aiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: request.prompt,
          use_rag: request.use_rag ?? true,
          max_tokens: request.max_tokens ?? 1000,
          temperature: request.temperature ?? 0.3,
          system_prompt: request.system_prompt,
          context: request.context,
        }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Unknown error occurred')
      }

      return data as AIResponse
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request was cancelled')
      }
      throw error
    } finally {
      // Only clear the abort controller if it's the same one we just used
      if (this.abortController === abortController) {
        this.abortController = null
      }
    }
  }

  /**
   * Cancel any ongoing request
   */
  cancelRequest(): void {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
  }

  /**
   * Generate a SQL query based on natural language prompt
   */
  async generateSQLQuery(prompt: string, context?: string): Promise<string> {
    const systemPrompt = `You are a SQL expert. Generate accurate SQL queries based on natural language prompts. 
    Focus on creating clean, efficient queries that follow best practices.
    Always return only the SQL query without any additional explanation or markdown formatting.`

    const response = await this.generateResponse({
      prompt,
      use_rag: true,
      max_tokens: 500,
      temperature: 0.1,
      system_prompt: systemPrompt,
      context,
    })

    return response.response
  }

  /**
   * Generate a Python script based on natural language prompt
   */
  async generatePythonScript(prompt: string, context?: string): Promise<string> {
    const systemPrompt = `You are a Python expert. Generate clean, efficient Python scripts based on natural language prompts.
    Include proper imports, error handling, and follow Python best practices.
    Return the complete Python code with appropriate comments.`

    const response = await this.generateResponse({
      prompt,
      use_rag: true,
      max_tokens: 800,
      temperature: 0.2,
      system_prompt: systemPrompt,
      context,
    })

    return response.response
  }

  /**
   * Generate a general response for any prompt
   */
  async generateGeneralResponse(prompt: string, context?: string): Promise<string> {
    const response = await this.generateResponse({
      prompt,
      use_rag: true,
      max_tokens: 1000,
      temperature: 0.3,
      context,
    })

    return response.response
  }
}

// Export singleton instance
export const aiService = AIService.getInstance()
