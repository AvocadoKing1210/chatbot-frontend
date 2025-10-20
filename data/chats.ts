export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: string
}

export interface ChatItem {
  id: string
  title: string
  preview: string
  updatedAt: string
  pinned?: boolean
  folderId?: string
  tags?: string[]
  messages: Message[]
  mode: 'sql' | 'python'
  chartEnabled: boolean
}

export interface CreateChatData {
  title?: string
  tags?: string[]
  mode: 'sql' | 'python'
  chartEnabled: boolean
  initialMessage?: string
}

// Mock data for demo
export const pinnedChats: ChatItem[] = [
  {
    id: "1",
    title: "Modern AI Chatbot Interface",
    preview: "Design discussion about UI components...",
    updatedAt: "2024-01-15T10:30:00Z",
    pinned: true,
    folderId: "1",
    tags: ["design", "ui"],
    mode: "sql",
    chartEnabled: true,
    messages: [
      {
        id: "1-1",
        content: "Can you help me design a modern chatbot interface?",
        role: "user",
        timestamp: "2024-01-15T10:30:00Z"
      },
      {
        id: "1-2",
        content: "I'd be happy to help you design a modern chatbot interface! Here are some key principles to consider:\n\n1. **Clean and Minimal Design**: Keep the interface uncluttered with plenty of white space\n2. **Clear Message Bubbles**: Use distinct styling for user and bot messages\n3. **Responsive Layout**: Ensure it works well on both desktop and mobile\n4. **Accessibility**: Include proper contrast ratios and keyboard navigation\n5. **Loading States**: Show typing indicators and loading animations\n\nWould you like me to elaborate on any of these aspects or help you with specific design elements?",
        role: "assistant",
        timestamp: "2024-01-15T10:30:15Z"
      }
    ]
  },
  {
    id: "6",
    title: "Database Optimization Guide",
    preview: "Performance tuning and query optimization techniques...",
    updatedAt: "2024-01-16T14:20:00Z",
    pinned: true,
    folderId: "1",
    tags: ["database", "performance", "sql"],
    mode: "sql",
    chartEnabled: true,
    messages: [
      {
        id: "6-1",
        content: "How can I optimize my database queries for better performance?",
        role: "user",
        timestamp: "2024-01-16T14:20:00Z"
      },
      {
        id: "6-2",
        content: "Database optimization is crucial for application performance. Here are the key strategies:\n\n## Indexing Strategy\n- Create indexes on frequently queried columns\n- Use composite indexes for multi-column queries\n- Monitor index usage with `EXPLAIN ANALYZE`\n\n## Query Optimization\n- Use `LIMIT` to reduce result sets\n- Avoid `SELECT *` in production\n- Use `JOIN` instead of subqueries when possible\n\n## Database Maintenance\n- Regular `VACUUM` and `ANALYZE` operations\n- Monitor slow query logs\n- Use connection pooling\n\nWould you like me to dive deeper into any specific optimization technique?",
        role: "assistant",
        timestamp: "2024-01-16T14:20:15Z"
      }
    ]
  },
  {
    id: "7",
    title: "React Performance Best Practices",
    preview: "Memoization, lazy loading, and optimization techniques...",
    updatedAt: "2024-01-17T09:15:00Z",
    pinned: true,
    folderId: "1",
    tags: ["react", "performance", "optimization"],
    mode: "python",
    chartEnabled: false,
    messages: [
      {
        id: "7-1",
        content: "What are the best practices for optimizing React applications?",
        role: "user",
        timestamp: "2024-01-17T09:15:00Z"
      },
      {
        id: "7-2",
        content: "React performance optimization involves several key strategies:\n\n## Component Optimization\n- Use `React.memo()` for expensive components\n- Implement `useMemo()` for expensive calculations\n- Apply `useCallback()` for stable function references\n\n## Bundle Optimization\n- Code splitting with `React.lazy()`\n- Dynamic imports for route-based splitting\n- Tree shaking to eliminate dead code\n\n## Rendering Optimization\n- Avoid inline object/function creation in render\n- Use `key` prop correctly in lists\n- Minimize re-renders with proper state management\n\n## Development Tools\n- React DevTools Profiler\n- Bundle analyzers like `webpack-bundle-analyzer`\n- Performance monitoring with `React.StrictMode`\n\nWould you like me to show you specific examples of these optimizations?",
        role: "assistant",
        timestamp: "2024-01-17T09:15:20Z"
      }
    ]
  },
]

export const recentChats: ChatItem[] = [
  {
    id: "2",
    title: "Chatbot app with UI",
    preview: "Implementation details for the chat interface...",
    updatedAt: "2024-01-14T15:45:00Z",
    folderId: "2",
    tags: ["development", "react"],
    mode: "python",
    chartEnabled: false,
    messages: [
      {
        id: "2-1",
        content: "How do I implement a chat interface in React?",
        role: "user",
        timestamp: "2024-01-14T15:45:00Z"
      },
      {
        id: "2-2",
        content: "To implement a chat interface in React, you'll need several key components:\n\n1. **Message List Component**: Display messages in a scrollable container\n2. **Input Component**: Handle user input with send functionality\n3. **State Management**: Track messages, typing status, and user data\n4. **WebSocket Integration**: For real-time messaging (optional)\n\nHere's a basic structure:\n\n```jsx\nconst ChatInterface = () => {\n  const [messages, setMessages] = useState([]);\n  const [inputValue, setInputValue] = useState('');\n  \n  const sendMessage = () => {\n    // Add message to state\n    // Send to backend\n  };\n  \n  return (\n    <div className=\"chat-container\">\n      <MessageList messages={messages} />\n      <MessageInput \n        value={inputValue}\n        onChange={setInputValue}\n        onSend={sendMessage}\n      />\n    </div>\n  );\n};\n```\n\nWould you like me to show you how to implement any specific part?",
        role: "assistant",
        timestamp: "2024-01-14T15:45:20Z"
      }
    ]
  },
  {
    id: "3",
    title: "Design Geist component",
    preview: "Working on the design system components...",
    updatedAt: "2024-01-13T09:20:00Z",
    folderId: "2",
    tags: ["design-system", "components"],
    mode: "sql",
    chartEnabled: true,
    messages: [
      {
        id: "3-1",
        content: "What's the best way to create reusable UI components?",
        role: "user",
        timestamp: "2024-01-13T09:20:00Z"
      },
      {
        id: "3-2",
        content: "Creating reusable UI components is essential for maintaining consistency and efficiency. Here are the best practices:\n\n**1. Component Design Principles:**\n- Single Responsibility: Each component should have one clear purpose\n- Props Interface: Define clear, typed props with sensible defaults\n- Composition over Inheritance: Build complex components from simpler ones\n\n**2. Styling Approach:**\n- Use CSS-in-JS or utility classes (like Tailwind)\n- Support theming and customization\n- Ensure accessibility compliance\n\n**3. Documentation:**\n- Storybook for component documentation\n- Clear prop descriptions and examples\n- Usage guidelines and best practices\n\n**4. Testing:**\n- Unit tests for component logic\n- Visual regression tests\n- Accessibility testing\n\nWould you like me to show you how to implement a specific component pattern?",
        role: "assistant",
        timestamp: "2024-01-13T09:20:25Z"
      }
    ]
  },
  {
    id: "4",
    title: "Data Analysis with Tables",
    preview: "Analyzing sales data and creating visualizations...",
    updatedAt: "2024-01-12T14:15:00Z",
    folderId: "3",
    tags: [
      "data-analysis",
      "tables",
      "charts",
      "longer-tag-here",
      "insights",
      "dashboard",
      "performance",
      "metrics"
    ],
    mode: "sql",
    chartEnabled: true,
    messages: [
      {
        id: "4-1",
        content: "Can you help me analyze this sales data and create a summary table?",
        role: "user",
        timestamp: "2024-01-12T14:15:00Z"
      },
      {
        id: "4-2",
        content: "I'd be happy to help you analyze the sales data! Here's a comprehensive summary table of your Q4 2023 sales performance:\n\n| Product Category | Units Sold | Revenue | Growth % | Top Region |\n|------------------|------------|---------|----------|------------|\n| Electronics | 2,450 | $487,500 | +15.2% | North America |\n| Clothing | 3,200 | $128,000 | +8.7% | Europe |\n| Home & Garden | 1,800 | $162,000 | +22.1% | Asia Pacific |\n| Sports & Outdoors | 1,100 | $99,000 | -3.2% | North America |\n| Books & Media | 2,800 | $84,000 | +12.5% | Europe |\n| Health & Beauty | 1,950 | $156,000 | +18.9% | North America |\n\n**Key Insights:**\n- **Total Revenue**: $1,116,500\n- **Best Performer**: Home & Garden (+22.1% growth)\n- **Needs Attention**: Sports & Outdoors (-3.2% decline)\n- **Top Market**: North America (40% of total sales)\n\nWould you like me to create a chart visualization or dive deeper into any specific category?",
        role: "assistant",
        timestamp: "2024-01-12T14:15:30Z"
      },
      {
        id: "4-3",
        content: "Can you show me the monthly breakdown for Electronics?",
        role: "user",
        timestamp: "2024-01-12T14:16:00Z"
      },
      {
        id: "4-4",
        content: "Here's the monthly breakdown for Electronics sales in Q4 2023:\n\n| Month | Units Sold | Revenue | Avg Price | Market Share |\n|-------|------------|---------|-----------|--------------|\n| October | 780 | $152,100 | $195.00 | 32% |\n| November | 920 | $189,750 | $206.25 | 38% |\n| December | 750 | $145,650 | $194.20 | 30% |\n\n**Monthly Analysis:**\n- **Peak Month**: November (Black Friday/Cyber Monday impact)\n- **Average Price Trend**: Slight increase in November, then stabilization\n- **Consistent Performance**: All months above 30% market share\n\n**Recommendations:**\n1. **Inventory Planning**: Stock up for November surge\n2. **Pricing Strategy**: November premium pricing worked well\n3. **Marketing Focus**: Leverage October momentum for December\n\nWould you like me to create a line chart showing the monthly trend or analyze any other metrics?",
        role: "assistant",
        timestamp: "2024-01-12T14:16:45Z"
      }
    ]
  },
  {
    id: "5",
    title: "Query & Chart Test",
    preview: "Test SQL execution and chart generation",
    updatedAt: "2024-01-18T12:00:00Z",
    folderId: "3",
    tags: ["test", "sql", "charts", "benchmarks", "optimizations", "longlonglongtag"],
    mode: "sql",
    chartEnabled: true,
    messages: [
      {
        id: "5-1",
        content: "Show me the average sales in 2020 for bikes",
        role: "user",
        timestamp: "2024-01-18T12:00:00Z"
      },
      {
        id: "5-2",
        content: "Here's a SQL query you can run to test the execution and chart flow using mock data. Click Execute below the code block, then optionally Generate chart.\n\n```sql\n-- Demo query for mock execution\nSELECT id, name, created_at\nFROM users\nLIMIT 3;\n```\n\nThis will render a table with mock rows and, if chart is enabled, embed the Superset chart.",
        role: "assistant",
        timestamp: "2024-01-18T12:00:10Z"
      }
    ]
  },
]

// Utility functions for chat management
export const createNewChat = (data: CreateChatData): ChatItem => {
  const id = Date.now().toString()
  const now = new Date().toISOString()
  
  return {
    id,
    title: data.title || "New Chat",
    preview: data.initialMessage || "New conversation started",
    updatedAt: now,
    tags: data.tags || [],
    mode: data.mode,
    chartEnabled: data.chartEnabled,
    messages: data.initialMessage ? [
      {
        id: `${id}-1`,
        content: data.initialMessage,
        role: "user",
        timestamp: now
      }
    ] : []
  }
}

export const addMessageToChat = (chat: ChatItem, content: string, role: 'user' | 'assistant'): ChatItem => {
  const newMessage: Message = {
    id: `${chat.id}-${Date.now()}`,
    content,
    role,
    timestamp: new Date().toISOString()
  }
  
  return {
    ...chat,
    messages: [...chat.messages, newMessage],
    updatedAt: new Date().toISOString(),
    preview: content.length > 50 ? content.substring(0, 50) + "..." : content
  }
}

export const updateChatTitle = (chat: ChatItem, title: string): ChatItem => {
  return {
    ...chat,
    title,
    updatedAt: new Date().toISOString()
  }
}

export const updateChatTags = (chat: ChatItem, tags: string[]): ChatItem => {
  return {
    ...chat,
    tags,
    updatedAt: new Date().toISOString()
  }
}
