# Mode Provider

The Mode Provider manages the application's current mode (SQL or Python Script) and makes it accessible throughout the component tree.

## Usage

### 1. Access Mode in Components

```tsx
import { useMode } from "@/components/providers/mode-provider"

function MyComponent() {
  const { selectedMode, isSqlMode, isPythonMode, setSelectedMode } = useMode()
  
  return (
    <div>
      <p>Current mode: {selectedMode}</p>
      {isSqlMode && <p>SQL mode is active</p>}
      {isPythonMode && <p>Python mode is active</p>}
    </div>
  )
}
```

### 2. Available Properties

- `selectedMode`: Current mode ("sql" | "python")
- `setSelectedMode`: Function to change the mode
- `isSqlMode`: Boolean indicating if SQL mode is active
- `isPythonMode`: Boolean indicating if Python mode is active

### 3. Mode Types

```tsx
type AppMode = "sql" | "python"
```

### 4. Example Components

See `components/examples/mode-aware-component.tsx` for examples of how to use the mode context in your components.

## Integration

The ModeProvider is already set up in `MainLayout` and wraps the entire application, so any component can access the mode using the `useMode` hook.
