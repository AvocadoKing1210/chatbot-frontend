/**
 * Test component to verify AI integration
 * This component can be used to test the AI service without going through the full chat flow
 */

"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAIChat } from "@/hooks/use-ai-chat"
import { Loader2, Send, Database, Code, MessageSquare } from "lucide-react"

export function AIIntegrationTest() {
  const [prompt, setPrompt] = React.useState("")
  const [response, setResponse] = React.useState("")
  const [mode, setMode] = React.useState<'sql' | 'python' | 'general'>('general')
  
  const { 
    isLoading, 
    error, 
    generateSQLQuery, 
    generatePythonScript, 
    generateGeneralResponse,
    clearError 
  } = useAIChat({
    onError: (error) => {
      console.error('AI Test Error:', error)
    },
    onSuccess: (response) => {
      console.log('AI Test Success:', response)
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    try {
      let result: string
      switch (mode) {
        case 'sql':
          result = await generateSQLQuery(prompt)
          break
        case 'python':
          result = await generatePythonScript(prompt)
          break
        default:
          result = await generateGeneralResponse(prompt)
      }
      setResponse(result)
    } catch (error) {
      console.error('Test error:', error)
    }
  }

  const testPrompts = {
    sql: [
      "Show me bike sharing usage on rainy days",
      "Find the top 10 customers by total orders",
      "Get average sales by month for the last year"
    ],
    python: [
      "Create a function to calculate fibonacci numbers",
      "Write a script to read CSV data and create a bar chart",
      "Implement a simple web scraper for news headlines"
    ],
    general: [
      "Explain how machine learning works",
      "What are the benefits of using TypeScript?",
      "How do I optimize database queries?"
    ]
  }

  const modeIcons = {
    sql: <Database className="w-4 h-4" />,
    python: <Code className="w-4 h-4" />,
    general: <MessageSquare className="w-4 h-4" />
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            AI Integration Test
          </CardTitle>
          <CardDescription>
            Test the AI service integration with different modes and prompts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode Selection */}
          <div className="flex gap-2">
            {(['sql', 'python', 'general'] as const).map((m) => (
              <Button
                key={m}
                variant={mode === m ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setMode(m)
                  setResponse("")
                  clearError()
                }}
                className="flex items-center gap-2"
              >
                {modeIcons[m]}
                {m.toUpperCase()}
              </Button>
            ))}
          </div>

          {/* Test Prompts */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Quick Test Prompts:</h4>
            <div className="flex flex-wrap gap-2">
              {testPrompts[mode].map((testPrompt, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => setPrompt(testPrompt)}
                  className="text-xs"
                >
                  {testPrompt}
                </Button>
              ))}
            </div>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Prompt:</label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={`Enter your ${mode} prompt here...`}
                className="min-h-[100px]"
                disabled={isLoading}
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={isLoading || !prompt.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Response...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Generate Response
                </>
              )}
            </Button>
          </form>

          {/* Error Display */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-red-700">
                  <Badge variant="destructive">Error</Badge>
                  <span className="text-sm">{error.message}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Response Display */}
          {response && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Response</CardTitle>
                <CardDescription>
                  Generated using {mode.toUpperCase()} mode
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {response}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
