"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  PanelLeftClose, 
  PanelLeftOpen, 
  Search, 
  Plus, 
  Star, 
  Clock, 
  Folder, 
  FileText,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SidebarSection } from "./sidebar-section"
import { UserMenu } from "./user-menu"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Kbd } from "@/components/ui/kbd"
import { cn, getKeyboardShortcut } from "@/lib/utils"
import { folders, templates } from "@/data"
import { useChat } from "@/components/providers/chat-provider"
import { ChatListItem } from "@/components/ai-elements/chat-list-item"
import { Bot } from "lucide-react"
import SearchModal from "@/components/layout/search-modal"


interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  className?: string
}

export function Sidebar({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
  className,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const [collapsedSections, setCollapsedSections] = React.useState({
    pinned: false,
    recent: false,
    folders: false,
    templates: false,
  })
  const [isMobile, setIsMobile] = React.useState(false)
  const [isInitialized, setIsInitialized] = React.useState(false)
  const [keyboardShortcut, setKeyboardShortcut] = React.useState("Ctrl + K")
  const { chats, createChat, setCurrentChat } = useChat()
  const router = useRouter()

  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 // md breakpoint
      setIsMobile(mobile)
      setIsInitialized(true)
    }
    
    // Set keyboard shortcut on client side to avoid hydration mismatch
    setKeyboardShortcut(getKeyboardShortcut('K'))
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Lock body scroll when mobile sidebar is open
  React.useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobile, isOpen])

  // Global keyboard shortcut for search (Cmd/Ctrl + K)
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        return
      }
      const isMac = navigator.platform.toLowerCase().includes('mac')
      const modifierKey = isMac ? event.metaKey : event.ctrlKey
      if (modifierKey && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setIsSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])


  const toggleSection = (section: keyof typeof collapsedSections) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleNewChat = () => {
    // Navigate to home page to start a new conversation
    router.push('/')
  }

  const handleChatClick = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId)
    if (chat && chat.messages.length > 0) {
      setCurrentChat(chat)
      router.push(`/chat/${chatId}`)
    }
  }

  const handleLogout = () => {
    // In a real app, this would handle logout
    console.log("Logging out...")
  }

  const handleSettings = () => {
    // In a real app, this would open settings
    console.log("Opening settings...")
  }

  // Collapsed sidebar view (desktop only)
  if (isCollapsed && !isMobile) {
    return (
      <>
      <motion.aside
        initial={{ width: 320 }}
        animate={{ width: 64 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className={cn(
          "flex h-full flex-col border-r bg-background",
          className
        )}
      >
        <div className="flex items-center justify-center border-b p-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse}
                className="h-8 w-8"
              >
                <PanelLeftOpen className="h-4 w-4" />
                <span className="sr-only">Expand sidebar</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <div className="flex items-center gap-2">
                <span>Expand Sidebar</span>
                <Kbd>{getKeyboardShortcut('B')}</Kbd>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex flex-col items-center gap-4 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNewChat}
            className="h-8 w-8"
            title="New Chat"
          >
            <Plus className="h-4 w-4" />
            <span className="sr-only">New Chat</span>
          </Button>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="h-4 w-4" />
                <span className="sr-only">Search</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <div className="flex items-center gap-2">
                <span>Search</span>
                <Kbd>{getKeyboardShortcut('K')}</Kbd>
              </div>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <Folder className="h-4 w-4" />
                <span className="sr-only">Folders</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <div className="flex items-center gap-2">
                <span>Folders</span>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="mt-auto p-4">
          <ThemeToggle />
        </div>
      </motion.aside>
      <SearchModal
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        conversations={chats}
        onSelectConversation={handleChatClick}
        onCreateNewChat={handleNewChat}
      />
      </>
    )
  }

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && isMobile && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={{ x: -320 }}
        animate={{ 
          x: isInitialized ? (isMobile ? (isOpen ? 0 : -320) : 0) : -320,
          width: isInitialized ? (!isMobile && isCollapsed ? 64 : 320) : 320
        }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className={cn(
          "flex h-full flex-col border-r bg-background",
          isMobile ? "fixed inset-y-0 left-0 z-50" : "relative",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-foreground text-background shadow-sm">
              <Bot className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold">Data Bot</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleCollapse}
                  className="hidden md:flex h-8 w-8"
                >
                  <PanelLeftClose className="h-4 w-4" />
                  <span className="sr-only">Collapse sidebar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="flex items-center gap-2">
                  <span>Collapse Sidebar</span>
                  <Kbd>{getKeyboardShortcut('B')}</Kbd>
                </div>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="md:hidden h-8 w-8"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close sidebar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="flex items-center gap-2">
                  <span>Close Sidebar</span>
                  <Kbd>Esc</Kbd>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`Search... (${keyboardShortcut})`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchOpen(true)}
              className="pl-9"
            />
          </div>
        </div>

        {/* New Chat Button */}
        <div className="px-4">
          <Button
            onClick={handleNewChat}
            className="w-full"
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Start New Chat
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
          {/* Pinned Chats */}
          <SidebarSection
            title="PINNED CHATS"
            icon={<Star className="h-4 w-4" />}
            collapsed={collapsedSections.pinned}
            onToggle={() => toggleSection("pinned")}
          >
            {chats.filter(chat => chat.pinned).length === 0 ? (
              <div className="rounded-lg border border-dashed border-muted-foreground/25 p-3 text-center text-xs text-muted-foreground">
                Pin important chats for quick access.
              </div>
            ) : (
              chats.filter(chat => chat.pinned).map((chat) => (
                <ChatListItem
                  key={chat.id}
                  chat={chat}
                  onClick={handleChatClick}
                />
              ))
            )}
          </SidebarSection>

          {/* Recent Chats */}
          <SidebarSection
            title="RECENT"
            icon={<Clock className="h-4 w-4" />}
            collapsed={collapsedSections.recent}
            onToggle={() => toggleSection("recent")}
          >
            {chats.filter(chat => !chat.pinned).length === 0 ? (
              <div className="rounded-lg border border-dashed border-muted-foreground/25 p-3 text-center text-xs text-muted-foreground">
                No conversations yet. Start a new one!
              </div>
            ) : (
              chats
                .filter(chat => !chat.pinned)
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                .map((chat) => (
                  <ChatListItem
                    key={chat.id}
                    chat={chat}
                    onClick={handleChatClick}
                  />
                ))
            )}
          </SidebarSection>

          {/* Folders */}
          <SidebarSection
            title="FOLDERS"
            icon={<Folder className="h-4 w-4" />}
            collapsed={collapsedSections.folders}
            onToggle={() => toggleSection("folders")}
          >
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start mb-2"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create folder
            </Button>
            
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="flex items-center justify-between rounded-lg p-2 text-sm hover:bg-accent cursor-pointer transition-all duration-200 hover:scale-[1.02]"
              >
                <span className="truncate">{folder.name}</span>
                <span className="text-xs text-muted-foreground">
                  {folder.count}
                </span>
              </div>
            ))}
          </SidebarSection>

          {/* Templates */}
          <SidebarSection
            title="TEMPLATES"
            icon={<FileText className="h-4 w-4" />}
            collapsed={collapsedSections.templates}
            onToggle={() => toggleSection("templates")}
          >
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start mb-2"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create template
            </Button>
            
            {templates.map((template) => (
              <div
                key={template.id}
                className="rounded-lg p-2 text-sm hover:bg-accent cursor-pointer transition-all duration-200 hover:scale-[1.02]"
              >
                <div className="font-medium truncate">{template.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {template.preview}
                </div>
              </div>
            ))}
          </SidebarSection>
        </nav>

        {/* Footer */}
        <div className="border-t p-4">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <UserMenu
                onLogout={handleLogout}
              />
            </div>
            <ThemeToggle />
          </div>
        </div>
      </motion.aside>
      <SearchModal
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        conversations={chats}
        onSelectConversation={handleChatClick}
        onCreateNewChat={handleNewChat}
      />
    </>
  )
}
