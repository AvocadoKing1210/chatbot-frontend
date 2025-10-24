"use client"

import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"

interface DeleteFolderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folderName: string
  chatCount: number
  onConfirm: () => void
}

export function DeleteFolderDialog({
  open,
  onOpenChange,
  folderName,
  chatCount,
  onConfirm
}: DeleteFolderDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Delete Folder
          </AlertDialogTitle>
          <div className="space-y-3">
            <AlertDialogDescription>
              Are you sure you want to delete the folder <strong>&quot;{folderName}&quot;</strong>?
            </AlertDialogDescription>
            {chatCount > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground">
                  This folder contains {chatCount} chat{chatCount !== 1 ? 's' : ''}. 
                  The chats will be moved out of this folder but won&apos;t be deleted.
                </span>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              This action cannot be undone.
            </p>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            Delete Folder
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
