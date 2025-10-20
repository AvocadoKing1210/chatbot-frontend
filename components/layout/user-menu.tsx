"use client"

import * as React from "react"
import { useState } from "react"
import { LogOut, User, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers/auth-provider"
import { defaultUser } from "@/data"

interface UserMenuProps {
  user?: {
    name: string
    email: string
    avatar?: string
    workspace?: string
  }
  onLogout?: () => void
}

export function UserMenu({ 
  user,
  onLogout
}: UserMenuProps) {
  const { user: authUser, signOut } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  
  // Use authenticated user data if available, otherwise fall back to default
  const displayUser = authUser ? {
    name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
    email: authUser.email || '',
    avatar: authUser.user_metadata?.avatar_url,
    workspace: user?.workspace
  } : (user || defaultUser)

  const initials = displayUser.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      
      if (onLogout) {
        // Use the logout function passed from parent (sidebar)
        await onLogout()
      } else {
        // Fallback to direct Supabase logout
        console.log('Signing out user...')
        const { error } = await signOut()
        if (error) {
          console.error('Logout error:', error)
          alert('Failed to sign out. Please try again.')
        } else {
          console.log('Successfully signed out')
          // The auth state change will be handled by the auth provider
          // and the user will be redirected by the middleware
        }
      }
    } catch (error) {
      console.error('Logout error:', error)
      alert('Failed to sign out. Please try again.')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-auto p-2 w-full justify-start transition-all duration-200 hover:bg-accent">
          <div className="flex items-center gap-3 w-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={displayUser.avatar} alt={displayUser.name} />
              <AvatarFallback className="text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start min-w-0 flex-1">
              <span className="text-sm font-medium truncate">{displayUser.name}</span>
              {displayUser.workspace && (
                <span className="text-xs text-muted-foreground truncate">
                  {displayUser.workspace}
                </span>
              )}
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayUser.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {displayUser.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleLogout} 
          className="text-red-600"
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Signing out...</span>
            </>
          ) : (
            <>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
