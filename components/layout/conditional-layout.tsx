'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { SidebarProvider } from '@/components/providers/sidebar-provider'
import { ChatProvider } from '@/components/providers/chat-provider'
import { PersistentLayout } from './persistent-layout'
import { usePathname } from 'next/navigation'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    )
  }

  // For auth pages (login, signup, auth errors), show minimal layout
  if (pathname.startsWith('/login') || pathname.startsWith('/auth')) {
    return <>{children}</>
  }

  // For authenticated users, show full layout with sidebar
  if (user) {
    return (
      <SidebarProvider>
        <ChatProvider>
          <PersistentLayout>
            {children}
          </PersistentLayout>
        </ChatProvider>
      </SidebarProvider>
    )
  }

  // For unauthenticated users, don't render anything
  // Let the middleware handle the redirect to login
  return null
}
