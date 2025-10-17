"use client"

import * as React from "react"
import { Menu, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sidebar } from "./sidebar"
import { ChatInput } from "@/components/ai-elements/chat-input"
import { cn } from "@/lib/utils"

interface MainLayoutProps {
  className?: string
}

export function MainLayout({ className }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleSendMessage = (message: string) => {
    console.log("Sending message:", message)
    // In a real app, this would send the message to the chat API
  }

  return (
    <div className={cn("flex h-screen bg-background", className)}>
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile Header */}
        {isMobile && (
          <div className="flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="h-8 w-8"
              >
                <Menu className="h-4 w-4" />
                <span className="sr-only">Open sidebar</span>
              </Button>
              <div className="flex items-center gap-2">
                <div className="grid h-6 w-6 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-sm">
                  <span className="text-xs font-bold">✱</span>
                </div>
                <span className="text-sm font-semibold">AI Assistant</span>
              </div>
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex flex-1 flex-col">
          {/* Chat Header */}
          <div className="border-b p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="h-5 w-5" />
              <h1 className="text-lg font-semibold">New Chat</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Updated 1 second ago · 0 messages
            </p>
            <div className="flex gap-2 mt-2">
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Certified
              </span>
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                Personalized
              </span>
              <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                Experienced
              </span>
              <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                Helpful
              </span>
            </div>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 p-4">
            <div className="flex h-full items-center justify-center">
              <div className="text-center space-y-4">
                <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8">
                  <p className="text-muted-foreground">
                    No messages yet. Say hello to start.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Input */}
          <div className="border-t p-4">
            <ChatInput
              onSend={handleSendMessage}
              placeholder="How can I help you today?"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
