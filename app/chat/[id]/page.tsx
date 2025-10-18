"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import { useChat } from "@/components/providers/chat-provider"
import { ChatInterface } from "@/components/ai-elements/chat-interface"
import { ChatLayout } from "@/components/layout/chat-layout"

function ChatPageContent() {
  const params = useParams()
  const router = useRouter()
  const { currentChat, setCurrentChat, chats } = useChat()
  const chatId = params.id as string

  useEffect(() => {
    if (chatId) {
      const chat = chats.find(c => c.id === chatId)
      if (chat) {
        setCurrentChat(chat)
      } else {
        // Chat not found, redirect to home
        router.push('/')
      }
    }
  }, [chatId, chats, setCurrentChat, router])

  if (!currentChat || currentChat.id !== chatId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Loading chat...</h2>
          <p className="text-muted-foreground">Please wait while we load your conversation.</p>
        </div>
      </div>
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
