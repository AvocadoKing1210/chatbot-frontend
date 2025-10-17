export interface TemplateItem {
  id: string
  name: string
  preview: string
}

export const templates: TemplateItem[] = [
  { id: "1", name: "Code Review Template", preview: "Review code for..." },
  { id: "2", name: "Meeting Notes", preview: "Meeting agenda and notes..." },
]
