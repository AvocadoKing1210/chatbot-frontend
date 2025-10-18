export interface ChatItem {
  id: string
  title: string
  preview: string
  updatedAt: string
  pinned?: boolean
}

export const pinnedChats: ChatItem[] = [
  {
    id: "1",
    title: "Modern AI Chatbot Interface",
    preview: "Design discussion about UI components...",
    updatedAt: "2024-01-15T10:30:00Z",
    pinned: true,
  },
]

export const recentChats: ChatItem[] = [
  {
    id: "2",
    title: "Chatbot app with UI",
    preview: "Implementation details for the chat interface...",
    updatedAt: "2024-01-14T15:45:00Z",
  },
  {
    id: "3",
    title: "Design Geist component",
    preview: "Working on the design system components...",
    updatedAt: "2024-01-13T09:20:00Z",
  },
]
