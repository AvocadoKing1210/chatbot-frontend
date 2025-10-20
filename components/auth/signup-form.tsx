'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Mail, Lock } from 'lucide-react'
import { GoogleIcon } from '@/components/ui/google-icon'

interface SignupFormProps {
  onToggleMode: () => void
}

export function SignupForm({ onToggleMode }: SignupFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{
    email?: string
    password?: string
    confirmPassword?: string
  }>({})
  const { signUp, signInWithGoogle } = useAuth()

  const validateForm = () => {
    const errors: typeof validationErrors = {}
    
    // Email validation
    if (!email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    // Password validation
    if (!password) {
      errors.password = 'Password is required'
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    } else if (!/(?=.*[a-z])/.test(password)) {
      errors.password = 'Password must contain at least one lowercase letter'
    } else if (!/(?=.*[A-Z])/.test(password)) {
      errors.password = 'Password must contain at least one uppercase letter'
    } else if (!/(?=.*\d)/.test(password)) {
      errors.password = 'Password must contain at least one number'
    }
    
    // Confirm password validation
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)
    setValidationErrors({})

    // Validate form before submission
    if (!validateForm()) {
      setLoading(false)
      return
    }

    const { error } = await signUp(email, password)
    
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
    
    setLoading(false)
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError(null)

    // Add 2 second delay to see the animation
    await new Promise(resolve => setTimeout(resolve, 2000))

    const { error } = await signInWithGoogle()
    
    if (error) {
      setError(error.message)
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
    // Also clear confirm password error if passwords now match
    if (confirmPassword && e.target.value === confirmPassword && validationErrors.confirmPassword) {
      setValidationErrors(prev => ({ ...prev, confirmPassword: undefined }))
    }
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value)
    if (validationErrors.confirmPassword) {
      setValidationErrors(prev => ({ ...prev, confirmPassword: undefined }))
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          <CardDescription>
            We've sent you a confirmation link to verify your account
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Please check your email and click the confirmation link to complete your registration.
          </p>
          <Button
            variant="outline"
            onClick={onToggleMode}
            className="w-full"
          >
            Back to sign in
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Create account</CardTitle>
        <CardDescription>
          Sign up to get started with your AI assistant
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
                placeholder="Create a password"
                value={password}
                onChange={handlePasswordChange}
                className={`pl-10 ${validationErrors.password ? 'border-red-500 focus-visible:ring-red-500/20' : ''}`}
                disabled={loading}
              />
            </div>
            {validationErrors.password && (
              <p className="text-sm text-red-600 dark:text-red-400">{validationErrors.password}</p>
            )}
            {password && !validationErrors.password && (
              <div className="text-xs text-green-600 dark:text-green-400">
                ✓ Password meets all requirements
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
              <Input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                className={`pl-10 ${validationErrors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500/20' : ''}`}
                disabled={loading}
              />
            </div>
            {validationErrors.confirmPassword && (
              <p className="text-sm text-red-600 dark:text-red-400">{validationErrors.confirmPassword}</p>
            )}
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </Button>
        </form>
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Password requirements:</p>
          <ul className="space-y-0.5 ml-2">
            <li>• At least 6 characters</li>
            <li>• One lowercase letter</li>
            <li>• One uppercase letter</li>
            <li>• One number</li>
          </ul>
        </div>
        
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
              Signing up with Google...
            </>
          ) : (
            <>
              <GoogleIcon className="size-4" />
              Google
            </>
          )}
        </Button>
        
        <div className="text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <button
            type="button"
            onClick={onToggleMode}
            className="text-primary hover:underline font-medium"
            disabled={loading || googleLoading}
          >
            Sign in
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
