'use client'

import { useState } from "react"
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
import { getUserProfileFromAuth, getUserInitials } from "@/lib/auth/user-utils"
import { LogOut, Mail } from "lucide-react"
import { GoogleIcon } from "@/components/ui/google-icon"
import type { User } from "@/data/user"

interface UserMenuProps {
  user?: User
  onLogout?: () => void
}

export function UserMenu({
  user,
  onLogout
}: UserMenuProps) {
  const { user: authUser, signOut } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Get user profile directly from auth data - no database calls needed!
  const displayUser = authUser ? getUserProfileFromAuth(authUser) : (user || {
    name: 'Guest',
    email: '',
    avatar: undefined,
    provider: 'email'
  })

  const initials = getUserInitials(displayUser.name)

  // Get provider icon
  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'google':
        return <GoogleIcon className="h-3 w-3" />
      case 'email':
        return <Mail className="h-3 w-3" />
      default:
        return <Mail className="h-3 w-3" />
    }
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await signOut()
      onLogout?.()
    } catch (error) {
      console.error('Logout error:', error)
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
              {displayUser.email && (
                <span className="text-xs text-muted-foreground truncate">
                  {displayUser.email}
                </span>
              )}
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{displayUser.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {displayUser.email}
              </p>
            </div>
            {displayUser.provider && (
              <>
                <div className="border-t border-border/50"></div>
                <div className="flex flex-col space-y-1 text-xs text-muted-foreground">
                  <span className="font-medium">Provider:</span>
                  <div className="flex items-center gap-1">
                    {getProviderIcon(displayUser.provider)}
                    <span className="capitalize">{displayUser.provider}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="cursor-pointer text-red-600 focus:text-red-600"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoggingOut ? 'Signing out...' : 'Log out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}