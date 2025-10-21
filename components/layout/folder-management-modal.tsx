"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Folder, Plus, ChevronDown, ChevronRight } from "lucide-react"
import { CreateFolderModal } from "./create-folder-modal"
import { DeleteFolderDialog } from "@/components/ui/delete-folder-dialog"
import { FolderRow } from "./folder-row"
import { AnimatedChatList } from "@/components/ai-elements/animated-chat-list"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { cn } from "@/lib/utils"
import { useChat } from "@/components/providers/chat-provider"

interface FolderManagementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FolderManagementModal({
  open,
  onOpenChange
}: FolderManagementModalProps) {
  const [collapsedSections, setCollapsedSections] = React.useState({
    folders: false,
  })
  const [createFolderOpen, setCreateFolderOpen] = React.useState(false)
  const [editingFolder, setEditingFolder] = React.useState<any>(null)
  const [deleteFolderOpen, setDeleteFolderOpen] = React.useState(false)
  const [folderToDelete, setFolderToDelete] = React.useState<any>(null)
  const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(new Set())
  
  const { 
    chats, 
    folders, 
    isLoading,
    animatingChats,
    setCurrentChat, 
    togglePin, 
    deleteChat, 
    createFolder,
    updateFolder,
    deleteFolder,
    moveChatToFolder,
    onAnimationComplete
  } = useChat()

  const toggleSection = (section: keyof typeof collapsedSections) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleChatClick = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId)
    if (chat && chat.messages.length > 0) {
      setCurrentChat(chat)
      onOpenChange(false) // Close modal when chat is selected
    }
  }

  const handleDeleteChat = (chatId: string) => {
    deleteChat(chatId)
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


  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Manage Folders
            </DialogTitle>
            <DialogDescription>
              Organize your conversations by creating and managing folders.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Folders */}
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between p-2 h-auto"
                onClick={() => toggleSection("folders")}
              >
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  <span className="text-sm font-medium">FOLDERS</span>
                </div>
                {collapsedSections.folders ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              
              {!collapsedSections.folders && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
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
                        isCollapsed={false}
                        animatingChats={animatingChats}
                        onAnimationComplete={onAnimationComplete}
                      />
                    ))
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
