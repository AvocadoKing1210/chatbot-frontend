"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { useChat } from "@/components/providers/chat-provider"
import { ChatInterface } from "@/components/ai-elements/chat-interface"
import { ChatLayout } from "@/components/layout/chat-layout"
import { LoadingState } from "@/components/ui/loading-spinner"
import { getChat } from "@/data/chats"

function ChatPageContent() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { currentChat, setCurrentChat, chats } = useChat()
  const [isLoadingChat, setIsLoadingChat] = useState(true)
  const [chatNotFound, setChatNotFound] = useState(false)
  const chatId = params.id as string

  useEffect(() => {
    if (authLoading) return // Wait for auth to load

    if (!user) {
      // User not authenticated, redirect to login
      router.push('/login')
      return
    }

    if (chatId) {
      // First try to find chat in loaded chats
      const chat = chats.find(c => c.id === chatId)
      if (chat && chat.messages.length > 0) {
        // Only update if different or messages changed to avoid unnecessary re-mounts
        const shouldUpdate = !currentChat || currentChat.id !== chat.id || currentChat.messages.length !== chat.messages.length
        if (shouldUpdate) {
          setCurrentChat(chat)
        }
        setIsLoadingChat(false)
        return
      }

      // If not found in loaded chats, try to load it directly from database
      const loadChat = async () => {
        try {
          const chat = await getChat(chatId)
          if (chat && chat.messages.length > 0) {
            // Only update if different or messages changed
            const shouldUpdate = !currentChat || currentChat.id !== chat.id || currentChat.messages.length !== chat.messages.length
            if (shouldUpdate) {
              setCurrentChat(chat)
            }
            setIsLoadingChat(false)
          } else {
            setChatNotFound(true)
            setIsLoadingChat(false)
          }
        } catch (error) {
          console.error('Error loading chat:', error)
          setChatNotFound(true)
          setIsLoadingChat(false)
        }
      }

      loadChat()
    }
  }, [chatId, chats, setCurrentChat, router, user, authLoading, currentChat])

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <LoadingState
        title="Verifying authentication..."
        description="Please wait while we verify your authentication."
        className="h-full"
      />
    )
  }

  // Show loading while chat is loading
  if (isLoadingChat) {
    return (
      <LoadingState
        title="Loading chat..."
        description="Please wait while we load your conversation."
        className="h-full"
      />
    )
  }

  // Show error if chat not found
  if (chatNotFound) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Chat not found</h2>
          <p className="text-muted-foreground mb-4">The chat you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
          <button 
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  // Show loading if current chat doesn't match
  if (!currentChat || currentChat.id !== chatId) {
    return (
      <LoadingState
        title="Loading chat..."
        description="Please wait while we load your conversation."
        className="h-full"
      />
    )
  }

  return <ChatInterface chat={currentChat} />
}

export default function ChatPage() {
  return (
    <ChatLayout>
      <ChatPageContent />
    </ChatLayout>
  )
}
