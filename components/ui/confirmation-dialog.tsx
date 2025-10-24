"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface DeleteChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chatTitle: string
  onConfirm: () => void
}

export function DeleteChatDialog({
  open,
  onOpenChange,
  chatTitle,
  onConfirm,
}: DeleteChatDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Chat</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Are you sure you want to delete &quot;{chatTitle}&quot;? This action cannot be undone and will permanently remove all messages in this chat.
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirm}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Chat
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
