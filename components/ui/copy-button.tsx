"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface CopyButtonProps {
  text: string
  tooltip?: string
  className?: string
  size?: "sm" | "default" | "lg" | "icon"
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  onCopy?: () => void
}

export function CopyButton({ 
  text, 
  tooltip, 
  className, 
  size = "sm", 
  variant = "ghost",
  onCopy 
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation() // Prevent event bubbling
    
    if (isLoading) return
    
    setIsLoading(true)
    
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      onCopy?.()
      
      // Reset after 2 seconds
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const button = (
    <Button
      className={cn(
        "relative size-9 p-1.5 text-muted-foreground hover:text-foreground transition-colors",
        copied && "text-green-600 dark:text-green-400",
        className
      )}
      size={size}
      variant={variant}
      onClick={handleCopy}
      disabled={isLoading}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.div
            key="check"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center"
          >
            <Check className="h-4 w-4" />
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            initial={false}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center justify-center"
          >
            <Copy className="h-4 w-4" />
          </motion.div>
        )}
      </AnimatePresence>
      <span className="sr-only">{tooltip || "Copy to clipboard"}</span>
    </Button>
  )

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return button
}
