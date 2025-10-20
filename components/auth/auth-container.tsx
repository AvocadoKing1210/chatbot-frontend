'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { LoginForm } from './login-form'
import { SignupForm } from './signup-form'

export function AuthContainer() {
  const [isLogin, setIsLogin] = useState(true)
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // If user is already logged in, redirect them
    if (!loading && user) {
      const redirectTo = searchParams.get('redirect') || '/'
      console.log('User already logged in, redirecting to:', redirectTo)
      router.push(redirectTo)
    }
  }, [user, loading, router, searchParams])

  const toggleMode = () => {
    setIsLogin(!isLogin)
  }

  // Show loading while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    )
  }

  // If user is logged in, don't render the auth forms (redirect will happen)
  if (user) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {isLogin ? (
          <LoginForm onToggleMode={toggleMode} />
        ) : (
          <SignupForm onToggleMode={toggleMode} />
        )}
      </div>
    </div>
  )
}
