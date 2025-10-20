'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Mail, Lock } from 'lucide-react'
import { GoogleIcon } from '@/components/ui/google-icon'

interface LoginFormProps {
  onToggleMode: () => void
}

export function LoginForm({ onToggleMode }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<{
    email?: string
    password?: string
  }>({})
  const { signIn, signInWithGoogle } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const validateForm = () => {
    const errors: typeof validationErrors = {}
    
    if (!email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    if (!password) {
      errors.password = 'Password is required'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setValidationErrors({})

    if (!validateForm()) {
      setLoading(false)
      return
    }

    const { error } = await signIn(email, password)
    
    if (error) {
      setError(error.message)
    } else {
      // Redirect to intended page after successful login
      const redirectTo = searchParams.get('redirect') || '/'
      console.log('Login successful, redirecting to:', redirectTo)
      router.push(redirectTo)
    }
    
    setLoading(false)
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError(null)

    // Add 2 second delay to allow the smooth animation
    await new Promise(resolve => setTimeout(resolve, 2000))

    const redirectTo = searchParams.get('redirect') || '/'
    const { error } = await signInWithGoogle()
    
    if (error) {
      setError(error.message)
    } else {
      // Google OAuth will handle the redirect through the callback
      console.log('Google sign-in initiated, will redirect to:', redirectTo)
    }
    
    setGoogleLoading(false)
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (validationErrors.email) {
      setValidationErrors(prev => ({ ...prev, email: undefined }))
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    if (validationErrors.password) {
      setValidationErrors(prev => ({ ...prev, password: undefined }))
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
        <CardDescription>
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md dark:text-red-400 dark:bg-red-950/50 dark:border-red-800">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={handleEmailChange}
                className={`pl-10 ${validationErrors.email ? 'border-red-500 focus-visible:ring-red-500/20' : ''}`}
                disabled={loading}
              />
            </div>
            {validationErrors.email && (
              <p className="text-sm text-red-600 dark:text-red-400">{validationErrors.email}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={handlePasswordChange}
                className={`pl-10 ${validationErrors.password ? 'border-red-500 focus-visible:ring-red-500/20' : ''}`}
                disabled={loading}
              />
            </div>
            {validationErrors.password && (
              <p className="text-sm text-red-600 dark:text-red-400">{validationErrors.password}</p>
            )}
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
        >
          {googleLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Signing in with Google...
            </>
          ) : (
            <>
              <GoogleIcon className="size-4" />
              Google
            </>
          )}
        </Button>
        
        <div className="text-center text-sm">
          <span className="text-muted-foreground">Don't have an account? </span>
          <button
            type="button"
            onClick={onToggleMode}
            className="text-primary hover:underline font-medium"
            disabled={loading || googleLoading}
          >
            Sign up
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
