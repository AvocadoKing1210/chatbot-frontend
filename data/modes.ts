import type { SelectorOption } from "@/components/ai-elements/chat-input"

export const defaultMode = "sql" as const

export type AppMode = "sql" | "python"

// Mode configuration without JSX elements
export const modeConfig = [
  { 
    id: "sql" as const, 
    name: "SQL", 
    description: "Generate and execute SQL queries",
    iconName: "Database" as const
  },
  { 
    id: "python" as const, 
    name: "Python", 
    description: "Generate and run Python scripts",
    iconName: "CodeXml" as const
  },
] as const

// Function to create mode options with icons (to be called in client components)
export const createModeOptions = (): SelectorOption[] => {
  // This will be implemented in the component that needs the icons
  return modeConfig.map(config => ({
    id: config.id,
    name: config.name,
    description: config.description,
    // icon will be added by the component
  }))
}
