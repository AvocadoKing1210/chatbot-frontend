import type { User } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  provider?: string
}

/**
 * Extract user profile data directly from Supabase Auth User object
 * This eliminates the need for a separate profiles table
 */
export function getUserProfileFromAuth(user: User): UserProfile {
  // Determine the authentication provider
  const getProvider = () => {
    if (user.app_metadata?.provider) {
      return user.app_metadata.provider
    }
    // Check if it's OAuth by looking at user_metadata
    if (user.user_metadata?.avatar_url || user.user_metadata?.picture) {
      return 'google' // Most common OAuth provider
    }
    return 'email' // Default to email if no OAuth indicators
  }

  return {
    id: user.id,
    name: user.user_metadata?.full_name || 
          user.user_metadata?.name ||
          user.user_metadata?.display_name ||
          user.email?.split('@')[0] || 
          'User',
    email: user.email || '',
    avatar: user.user_metadata?.avatar_url ||
            user.user_metadata?.picture ||
            user.user_metadata?.photo_url,
    provider: getProvider()
  }
}

/**
 * Get user initials from name
 */
export function getUserInitials(name: string): string {
  return name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}
