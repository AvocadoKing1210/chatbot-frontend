// Simplified user data - no database calls needed!
// User data comes directly from Supabase Auth

export interface User {
  name: string
  email: string
  avatar?: string
  provider?: string
}

// Default user for fallback (when not authenticated)
export const defaultUser: User = {
  name: "Guest",
  email: "",
  provider: "email"
}