"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarSectionProps {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
  collapsed?: boolean
  onToggle?: () => void
  className?: string
}

export function SidebarSection({
  title,
  icon,
  children,
  collapsed = false,
  onToggle,
  className,
}: SidebarSectionProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200"
      >
        {icon && <span className="h-4 w-4">{icon}</span>}
        <span className="flex-1 text-left">{title}</span>
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            className="ml-6 space-y-1 overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
