"use client"

import * as React from "react"
import { Menu, Bot, Database, CodeXml } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sidebar } from "./sidebar"
import { ChatInput } from "@/components/ai-elements/chat-input"
import { InitialMessageArea } from "@/components/ai-elements/initial-message-area"
import { ModeProvider, useMode } from "@/components/providers/mode-provider"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Kbd } from "@/components/ui/kbd"
import { modeConfig, defaultMode } from "@/data"
import type { SelectorOption } from "@/components/ai-elements/chat-input"
import { cn, getKeyboardShortcut } from "@/lib/utils"

interface MainLayoutProps {
  className?: string
}

function MainLayoutContent({ className }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [chartEnabled, setChartEnabled] = React.useState(false)
  const [hasActiveConversation, setHasActiveConversation] = React.useState(false)
  const [conversationTitle, setConversationTitle] = React.useState("")
  const { selectedMode, setSelectedMode } = useMode()

  // Create mode options with icons
  const modeOptions: SelectorOption[] = React.useMemo(() => {
    const iconMap = {
      Database: <Database className="w-4 h-4" />,
      CodeXml: <CodeXml className="w-4 h-4" />,
    }

    return modeConfig.map(config => ({
      id: config.id,
      name: config.name,
      description: config.description,
      icon: iconMap[config.iconName],
    }))
  }, [])

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

  // Global keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return
      }

      const isMac = navigator.platform.toLowerCase().includes('mac')
      const modifierKey = isMac ? event.metaKey : event.ctrlKey

      // Sidebar toggle (Cmd/Ctrl + B)
      if (modifierKey && event.key.toLowerCase() === 'b') {
        event.preventDefault()
        setSidebarCollapsed(!sidebarCollapsed)
        return
      }

      // Search focus (Cmd/Ctrl + K)
      if (modifierKey && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        // Focus search input in sidebar
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
        return
      }


      // Close sidebar on Escape (mobile)
      if (event.key === 'Escape' && isMobile && sidebarOpen) {
        event.preventDefault()
        setSidebarOpen(false)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sidebarCollapsed, isMobile, sidebarOpen])

  // Update document title based on conversation state
  React.useEffect(() => {
    const title = hasActiveConversation && conversationTitle 
      ? `${conversationTitle} - Data Bot`
      : "Data Bot"
    document.title = title
  }, [hasActiveConversation, conversationTitle])

  const handleSendMessage = (message: string) => {
    console.log("Sending message:", message)
    setHasActiveConversation(true)
    // Set conversation title from first message
    if (!conversationTitle) {
      setConversationTitle(message.length > 30 ? message.substring(0, 30) + "..." : message)
    }
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(true)}
                    className="h-8 w-8"
                  >
                    <Menu className="h-4 w-4" />
                    <span className="sr-only">Open sidebar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <div className="flex items-center gap-2">
                    <span>Open Sidebar</span>
                    <Kbd>{getKeyboardShortcut('B')}</Kbd>
                  </div>
                </TooltipContent>
              </Tooltip>
              <div className="flex items-center gap-2">
                <div className="grid h-6 w-6 place-items-center rounded-full bg-foreground text-background shadow-sm">
                  <Bot className="h-3 w-3" />
                </div>
                <span className="text-sm font-semibold">Data Bot</span>
              </div>
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex flex-1 flex-col">
          {!hasActiveConversation ? (
            /* Initial Message Area - Simple with just title and input */
            <InitialMessageArea onStartChat={handleSendMessage}>
              <ChatInput
                onSend={handleSendMessage}
                placeholder={
                  selectedMode === "sql" 
                    ? chartEnabled 
                      ? "Ask me to write SQL queries and create charts automatically..." 
                      : "Ask me to write SQL queries..."
                    : chartEnabled 
                      ? "Ask me to write Python scripts and create charts automatically..." 
                      : "Ask me to write Python scripts..."
                }
                showSelector={true}
                selectorOptions={modeOptions}
                selectedValue={selectedMode}
                onSelectorChange={(value) => setSelectedMode(value as "sql" | "python")}
                selectorLabel="Select Mode"
                showChart={true}
                chartEnabled={chartEnabled}
                onChartToggle={setChartEnabled}
              />
            </InitialMessageArea>
          ) : (
            /* Active Conversation View */
            <>
              {/* Chat Header */}
              <div className="border-b p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="h-5 w-5" />
                  <h1 className="text-lg font-semibold">{conversationTitle || "Data Bot"}</h1>
                </div>
                <p className="text-sm text-muted-foreground">
                  Updated 1 second ago · Active conversation
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
                        Conversation started. Messages will appear here.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Input */}
              <div className="border-t p-4">
                <ChatInput
                  onSend={handleSendMessage}
                  placeholder={
                    selectedMode === "sql" 
                      ? chartEnabled 
                        ? "Ask me to write SQL queries and create charts automatically..." 
                        : "Ask me to write SQL queries..."
                      : chartEnabled 
                        ? "Ask me to write Python scripts and create charts automatically..." 
                        : "Ask me to write Python scripts..."
                  }
                  showSelector={true}
                  selectorOptions={modeOptions}
                  selectedValue={selectedMode}
                  onSelectorChange={(value) => setSelectedMode(value as "sql" | "python")}
                  selectorLabel="Select Mode"
                  showChart={true}
                  chartEnabled={chartEnabled}
                  onChartToggle={setChartEnabled}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function MainLayout({ className }: MainLayoutProps) {
  return (
    <ModeProvider defaultMode={defaultMode}>
      <MainLayoutContent className={className} />
    </ModeProvider>
  )
}
