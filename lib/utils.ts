import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Detect the operating system and return the appropriate modifier key
 * @returns "⌘" for Mac, "Ctrl" for Windows/Linux
 */
export function getModifierKey(): string {
  if (typeof window === 'undefined') return 'Ctrl'
  
  const platform = window.navigator.platform.toLowerCase()
  const userAgent = window.navigator.userAgent.toLowerCase()
  
  // Check for Mac
  if (platform.includes('mac') || userAgent.includes('mac')) {
    return '⌘'
  }
  
  return 'Ctrl'
}

/**
 * Get the keyboard shortcut display for a given key combination
 * @param key The main key (e.g., ',', '.', '/', ';')
 * @param withShift Whether to include Shift modifier
 * @returns Formatted keyboard shortcut string
 */
export function getKeyboardShortcut(key: string, withShift = false): string {
  const modifier = getModifierKey()
  if (withShift) {
    return `${modifier} + Shift + ${key}`
  }
  return `${modifier} + ${key}`
}
