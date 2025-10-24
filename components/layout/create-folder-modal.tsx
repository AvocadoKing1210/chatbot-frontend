"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Folder } from "lucide-react"
import { CreateFolderData } from "@/data/folders"

interface CreateFolderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateFolder: (data: CreateFolderData) => void
  isEditing?: boolean
  initialData?: CreateFolderData & { id?: string }
}


export function CreateFolderModal({
  open,
  onOpenChange,
  onCreateFolder,
  isEditing = false,
  initialData
}: CreateFolderModalProps) {
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Reset form when modal opens/closes or when editing data changes
  React.useEffect(() => {
    if (open) {
      if (isEditing && initialData) {
        setName(initialData.name)
        setDescription(initialData.description || "")
      } else {
        setName("")
        setDescription("")
      }
    }
  }, [open, isEditing, initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) return
    
    setIsSubmitting(true)
    
    try {
      await onCreateFolder({
        name: name.trim(),
        description: description.trim() || undefined
      })
      
      onOpenChange(false)
    } catch (error) {
      console.error("Error creating folder:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            {isEditing ? "Edit Folder" : "Create New Folder"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update your folder details below."
              : "Organize your chats by creating a new folder."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">Name</Label>
            <Input
              id="folder-name"
              placeholder="Enter folder name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              className="w-full"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="folder-description">Description (optional)</Label>
            <Textarea
              id="folder-description"
              placeholder="Add a description for this folder"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              className="w-full resize-none"
              rows={3}
            />
          </div>


          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <motion.div
                  className="flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {isEditing ? "Updating..." : "Creating..."}
                </motion.div>
              ) : (
                isEditing ? "Update Folder" : "Create Folder"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
