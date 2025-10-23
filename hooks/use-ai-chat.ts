/**
 * React hook for integrating AI chat functionality
 * Provides a clean interface for making AI requests with loading states and error handling
 */

import { useState, useCallback, useRef } from 'react'
import { aiService, AIRequest } from '@/lib/ai/ai-service'

export interface UseAIChatOptions {
  onError?: (error: Error) => void
  onSuccess?: (response: string) => void
}

export interface UseAIChatReturn {
  isLoading: boolean
  error: Error | null
  generateResponse: (request: AIRequest) => Promise<string>
  generateSQLQuery: (prompt: string, context?: string) => Promise<string>
  generatePythonScript: (prompt: string, context?: string) => Promise<string>
  generateGeneralResponse: (prompt: string, context?: string) => Promise<string>
  cancelRequest: () => void
  clearError: () => void
}

export function useAIChat(options: UseAIChatOptions = {}): UseAIChatReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const cancelRequest = useCallback(() => {
    aiService.cancelRequest()
    setIsLoading(false)
    setError(null)
  }, [])

  const handleRequest = useCallback(async <T>(
    requestFn: () => Promise<T>
  ): Promise<T> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await requestFn()
      options.onSuccess?.(result as string)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred')
      setError(error)
      options.onError?.(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [options])

  const generateResponse = useCallback(async (request: AIRequest): Promise<string> => {
    return handleRequest(async () => {
      const response = await aiService.generateResponse(request)
      return response.response
    })
  }, [handleRequest])

  const generateSQLQuery = useCallback(async (prompt: string, context?: string): Promise<string> => {
    return handleRequest(async () => {
      return await aiService.generateSQLQuery(prompt, context)
    })
  }, [handleRequest])

  const generatePythonScript = useCallback(async (prompt: string, context?: string): Promise<string> => {
    return handleRequest(async () => {
      return await aiService.generatePythonScript(prompt, context)
    })
  }, [handleRequest])

  const generateGeneralResponse = useCallback(async (prompt: string, context?: string): Promise<string> => {
    return handleRequest(async () => {
      return await aiService.generateGeneralResponse(prompt, context)
    })
  }, [handleRequest])

  return {
    isLoading,
    error,
    generateResponse,
    generateSQLQuery,
    generatePythonScript,
    generateGeneralResponse,
    cancelRequest,
    clearError,
  }
}
