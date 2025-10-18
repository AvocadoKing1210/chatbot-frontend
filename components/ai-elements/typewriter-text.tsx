"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TypewriterTextProps {
  texts: string[]
  className?: string
  typingSpeed?: number
  deletingSpeed?: number
  pauseTime?: number
  loop?: boolean
}

export function TypewriterText({
  texts,
  className,
  typingSpeed = 100,
  deletingSpeed = 50,
  pauseTime = 2000,
  loop = true
}: TypewriterTextProps) {
  const [currentTextIndex, setCurrentTextIndex] = React.useState(0)
  const [currentText, setCurrentText] = React.useState("")
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isPaused, setIsPaused] = React.useState(false)
  const [showPrompt, setShowPrompt] = React.useState(true)
  const [flashCount, setFlashCount] = React.useState(0)

  // Handle prompt flashing effect
  React.useEffect(() => {
    if (flashCount < 2) {
      const flashTimer = setTimeout(() => {
        setShowPrompt(!showPrompt)
        setFlashCount(prev => prev + 1)
      }, 300)
      return () => clearTimeout(flashTimer)
    }
  }, [showPrompt, flashCount])

  React.useEffect(() => {
    if (texts.length === 0) return

    const currentFullText = texts[currentTextIndex]
    
    // Wait for prompt flashing to complete
    if (flashCount < 2) return
    
    if (isPaused) {
      const pauseTimer = setTimeout(() => {
        setIsPaused(false)
        setIsDeleting(true)
      }, pauseTime)
      return () => clearTimeout(pauseTimer)
    }

    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        if (currentText.length < currentFullText.length) {
          setCurrentText(currentFullText.slice(0, currentText.length + 1))
        } else {
          // Finished typing, start pause
          setIsPaused(true)
        }
      } else {
        // Deleting
        if (currentText.length > 0) {
          setCurrentText(currentText.slice(0, -1))
        } else {
          // Finished deleting, reset for next text
          setIsDeleting(false)
          setFlashCount(0)
          setShowPrompt(true)
          if (loop) {
            setCurrentTextIndex((prev) => (prev + 1) % texts.length)
          } else if (currentTextIndex < texts.length - 1) {
            setCurrentTextIndex((prev) => prev + 1)
          }
        }
      }
    }, isDeleting ? deletingSpeed : typingSpeed)

    return () => clearTimeout(timer)
  }, [currentText, currentTextIndex, isDeleting, isPaused, texts, typingSpeed, deletingSpeed, pauseTime, loop, flashCount])

  return (
    <span className={cn("inline-block", className)}>
      <span className={cn("text-green-500 font-mono", !showPrompt && "opacity-0")}>
        &gt;
      </span>
      <span className="ml-1">{currentText}</span>
      <span className="animate-pulse" style={{ animationDuration: '1s' }}>|</span>
    </span>
  )
}
