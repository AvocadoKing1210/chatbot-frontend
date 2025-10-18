"use client"

import * as React from "react"
import { Menu, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sidebar } from "./sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Kbd } from "@/components/ui/kbd"
import { useSidebar } from "@/components/providers/sidebar-provider"
import { cn, getKeyboardShortcut } from "@/lib/utils"

interface PersistentLayoutProps {
  children: React.ReactNode
  className?: string
}

export function PersistentLayout({ children, className }: PersistentLayoutProps) {
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed, isMobile } = useSidebar()

  return (
    <div className={cn("flex h-screen bg-background overflow-hidden", className)}>
      {/* Persistent Sidebar - Always rendered, never unmounts */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Mobile Header - Only shown on mobile */}
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

        {/* Dynamic Content Area - This is where pages render */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}
