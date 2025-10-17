export interface FolderItem {
  id: string
  name: string
  count: number
}

export const folders: FolderItem[] = [
  { id: "1", name: "Work Projects", count: 8 },
  { id: "2", name: "Personal", count: 3 },
  { id: "3", name: "Code Reviews", count: 2 },
]
