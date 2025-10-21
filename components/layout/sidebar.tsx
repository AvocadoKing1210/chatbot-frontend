"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/components/providers/auth-provider"
import { 
  PanelLeftClose, 
  PanelLeftOpen, 
  Search, 
  Plus, 
  Star, 
  Clock, 
  Folder, 
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
import { useChat } from "@/components/providers/chat-provider"
import { ChatListItem } from "@/components/ai-elements/chat-list-item"
import { FolderRow } from "@/components/layout/folder-row"
import { CreateFolderModal } from "@/components/layout/create-folder-modal"
import { Bot } from "lucide-react"
import SearchModal from "@/components/layout/search-modal"
import { DeleteChatDialog } from "@/components/ui/confirmation-dialog"
import { DeleteFolderDialog } from "@/components/ui/delete-folder-dialog"
import { LoadingSpinner } from "@/components/ui/loading-spinner"


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
  const { signOut } = useAuth()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const [collapsedSections, setCollapsedSections] = React.useState({
    pinned: false,
    recent: false,
    folders: false,
  })
  const [isMobile, setIsMobile] = React.useState(false)
  const [isInitialized, setIsInitialized] = React.useState(false)
  const [keyboardShortcut, setKeyboardShortcut] = React.useState("Ctrl + K")
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false)
  const [chatToDelete, setChatToDelete] = React.useState<string | null>(null)
  const [deleteFolderOpen, setDeleteFolderOpen] = React.useState(false)
  const [folderToDelete, setFolderToDelete] = React.useState<any>(null)
  const [createFolderOpen, setCreateFolderOpen] = React.useState(false)
  const [editingFolder, setEditingFolder] = React.useState<any>(null)
  const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(new Set())
  const { 
    chats, 
    folders, 
    isLoading,
    createChat, 
    setCurrentChat, 
    togglePin, 
    deleteChat, 
    updateChat,
    createFolder,
    updateFolder,
    deleteFolder,
    moveChatToFolder
  } = useChat()
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
    
    // Close sidebar on mobile when starting new chat
    if (isMobile) {
      onClose()
    }
  }

  const handleChatClick = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId)
    if (chat && chat.messages.length > 0) {
      setCurrentChat(chat)
      router.push(`/chat/${chatId}`)
      
      // Close sidebar on mobile when chat is selected
      if (isMobile) {
        onClose()
      }
    }
  }

  const handleDeleteChat = (chatId: string) => {
    setChatToDelete(chatId)
    setDeleteConfirmOpen(true)
  }

  const confirmDeleteChat = () => {
    if (chatToDelete) {
      deleteChat(chatToDelete)
      setChatToDelete(null)
    }
  }

  const handleMoveChatToFolder = (chatId: string, folderId?: string) => {
    moveChatToFolder(chatId, folderId)
  }

  const handleCreateFolder = (data: any) => {
    createFolder(data)
    setCreateFolderOpen(false)
  }

  const handleEditFolder = (folder: any) => {
    setEditingFolder(folder)
    setCreateFolderOpen(true)
  }

  const handleUpdateFolder = (data: any) => {
    if (editingFolder) {
      updateFolder(editingFolder.id, data)
      setEditingFolder(null)
    }
    setCreateFolderOpen(false)
  }

  const handleDeleteFolder = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId)
    if (folder) {
      setFolderToDelete(folder)
      setDeleteFolderOpen(true)
    }
  }

  const confirmDeleteFolder = () => {
    if (folderToDelete) {
      deleteFolder(folderToDelete.id)
      setFolderToDelete(null)
    }
  }

  const toggleFolderExpansion = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(folderId)) {
        newSet.delete(folderId)
      } else {
        newSet.add(folderId)
      }
      return newSet
    })
  }

  const handleLogout = async () => {
    try {
      console.log("Logout triggered from sidebar...")
      const { error } = await signOut()
      if (error) {
        console.error('Logout error:', error)
        alert('Failed to sign out. Please try again.')
      } else {
        console.log('Successfully signed out from sidebar')
        // Immediately redirect to login page
        router.push('/login')
      }
    } catch (error) {
      console.error('Logout error:', error)
      alert('Failed to sign out. Please try again.')
    }
  }

  const handleSettings = () => {
    // In a real app, this would open settings
    console.log("Opening settings...")
  }

  // Removed separate collapsed render path to keep one persistent motion.aside

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
        initial={{ x: isMobile ? -320 : 0, width: 320 }}
        animate={{
          x: isInitialized ? (isMobile ? (isOpen ? 0 : -320) : 0) : (isMobile ? -320 : 0),
          // Only animate width on desktop to avoid shifting content with transforms
          width: isInitialized ? (!isMobile && isCollapsed ? 64 : 320) : 320
        }}
        transition={{
          // Use a spring for width changes (desktop), keep mobile x slide snappy
          type: "spring",
          stiffness: 260,
          damping: 28
        }}
        className={cn(
          "flex h-full flex-col border-r bg-background overflow-hidden",
          isMobile ? "fixed inset-y-0 left-0 z-50" : "relative",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-full shadow-sm",
                // Keep element mounted to avoid mount flicker; hide visually when collapsed on desktop
                isCollapsed && !isMobile ? "opacity-0" : "bg-foreground text-background"
              )}
            >
              <Bot className="h-4 w-4" />
            </div>
            {!isCollapsed && <span className="text-sm font-semibold">Data Bot</span>}
          </div>
          
          <div className={cn(
            "flex items-center gap-1",
            // Center the toggle button when collapsed on desktop
            isCollapsed && !isMobile ? "absolute left-1/2 transform -translate-x-1/2" : ""
          )}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleCollapse}
                  className="hidden md:flex h-8 w-8"
                >
                  {isCollapsed ? (
                    <PanelLeftOpen className="h-4 w-4" />
                  ) : (
                    <PanelLeftClose className="h-4 w-4" />
                  )}
                  <span className="sr-only">Toggle sidebar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="flex items-center gap-2">
                  <span>{isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}</span>
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

        {/* Body */}
        {!isMobile && isCollapsed ? (
          <>
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
          </>
        ) : (
          <>
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
            <nav className={cn(
              "flex-1 overflow-y-auto py-2 space-y-4",
              isCollapsed ? "px-2" : "px-4"
            )}>
          {/* Pinned Chats */}
          <SidebarSection
            title="PINNED CHATS"
            icon={<Star className="h-4 w-4" />}
            collapsed={collapsedSections.pinned}
            onToggle={() => toggleSection("pinned")}
          >
            {isLoading ? (
              <div className="flex items-center justify-center p-3">
                <LoadingSpinner size="sm" />
                <span className="ml-2 text-xs text-muted-foreground">Loading pinned chats...</span>
              </div>
            ) : chats.filter(chat => chat.pinned).length === 0 ? (
              <div className="rounded-lg border border-dashed border-muted-foreground/25 p-3 text-center text-xs text-muted-foreground">
                Pin important chats for quick access.
              </div>
            ) : (
              chats.filter(chat => chat.pinned).map((chat) => (
                <ChatListItem
                  key={chat.id}
                  chat={chat}
                  onClick={handleChatClick}
                  onTogglePin={togglePin}
                  onDelete={handleDeleteChat}
                  onMoveToFolder={handleMoveChatToFolder}
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
            {isLoading ? (
              <div className="flex items-center justify-center p-3">
                <LoadingSpinner size="sm" />
                <span className="ml-2 text-xs text-muted-foreground">Loading recent chats...</span>
              </div>
            ) : chats.filter(chat => !chat.pinned).length === 0 ? (
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
                    onTogglePin={togglePin}
                    onDelete={handleDeleteChat}
                    onMoveToFolder={handleMoveChatToFolder}
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
              onClick={() => setCreateFolderOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create folder
            </Button>
            
            {isLoading ? (
              <div className="flex items-center justify-center p-3">
                <LoadingSpinner size="sm" />
                <span className="ml-2 text-xs text-muted-foreground">Loading folders...</span>
              </div>
            ) : folders.length === 0 ? (
              <div className="rounded-lg border border-dashed border-muted-foreground/25 p-3 text-center text-xs text-muted-foreground">
                <Folder className="h-4 w-4 mx-auto mb-1" />
                No folders yet. Create one to organize your chats.
              </div>
            ) : (
              folders.map((folder) => (
                <FolderRow
                  key={folder.id}
                  folder={folder}
                  folders={folders}
                  chats={chats}
                  isExpanded={expandedFolders.has(folder.id)}
                  onToggle={() => toggleFolderExpansion(folder.id)}
                  onEdit={handleEditFolder}
                  onDelete={handleDeleteFolder}
                  onChatClick={handleChatClick}
                  onMoveChatToFolder={handleMoveChatToFolder}
                  onTogglePin={togglePin}
                  onDeleteChat={handleDeleteChat}
                  isCollapsed={isCollapsed}
                />
              ))
            )}
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
          </>
        )}
      </motion.aside>
      <SearchModal
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        conversations={chats}
        onSelectConversation={handleChatClick}
        onCreateNewChat={handleNewChat}
      />
      
      <DeleteChatDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        chatTitle={chatToDelete ? chats.find(c => c.id === chatToDelete)?.title || "this chat" : ""}
        onConfirm={confirmDeleteChat}
      />
      
      <CreateFolderModal
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        onCreateFolder={editingFolder ? handleUpdateFolder : handleCreateFolder}
        isEditing={!!editingFolder}
        initialData={editingFolder}
      />
      
      <DeleteFolderDialog
        open={deleteFolderOpen}
        onOpenChange={setDeleteFolderOpen}
        folderName={folderToDelete?.name || ""}
        chatCount={folderToDelete?.chatIds?.length || 0}
        onConfirm={confirmDeleteFolder}
      />
    </>
  )
}
