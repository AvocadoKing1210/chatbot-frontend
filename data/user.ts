export interface User {
  name: string
  email: string
  avatar?: string
  workspace?: string
}

export const defaultUser: User = {
  name: "John Doe",
  email: "john@example.com",
  workspace: "Pro workspace"
}
