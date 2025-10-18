"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Database, CodeXml } from "lucide-react"
import { ChatInput } from "@/components/ai-elements/chat-input"
import { InitialMessageArea } from "@/components/ai-elements/initial-message-area"
import { ModeProvider, useMode } from "@/components/providers/mode-provider"
import { useChat } from "@/components/providers/chat-provider"
import { modeConfig, defaultMode } from "@/data"
import type { SelectorOption } from "@/components/ai-elements/chat-input"

interface MainLayoutProps {
  className?: string
}

function MainLayoutContent({ className }: MainLayoutProps) {
  const router = useRouter()
  const [chartEnabled, setChartEnabled] = React.useState(false)
  const { selectedMode, setSelectedMode } = useMode()
  const { createChat } = useChat()

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

  // Global keyboard shortcuts for search focus
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return
      }

      const isMac = navigator.platform.toLowerCase().includes('mac')
      const modifierKey = isMac ? event.metaKey : event.ctrlKey

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
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSendMessage = (message: string) => {
    // Create a new chat and navigate to it
    const newChat = createChat({
      title: message.length > 30 ? message.substring(0, 30) + "..." : message,
      mode: selectedMode,
      chartEnabled,
      initialMessage: message
    })
    
    // Navigate to the new chat
    router.push(`/chat/${newChat.id}`)
  }

  return (
    <div className={`h-full flex flex-col ${className || ''}`}>
      {/* Initial Message Area - Simple with just title and input */}
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
