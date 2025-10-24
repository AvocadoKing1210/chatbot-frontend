"use client"

import * as React from "react"
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import { useTheme } from 'next-themes'

export function MuiThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()
  
  const muiTheme = React.useMemo(() => {
    const isDark = resolvedTheme === 'dark'
    
    return createTheme({
      palette: {
        mode: isDark ? 'dark' : 'light',
        primary: {
          main: isDark ? '#3b82f6' : '#2563eb', // blue-500/blue-600
        },
        secondary: {
          main: isDark ? '#64748b' : '#475569', // slate-500/slate-600
        },
        background: {
          default: isDark ? '#0f172a' : '#ffffff', // slate-900/white
          paper: isDark ? '#1e293b' : '#f8fafc', // slate-800/slate-50
        },
        text: {
          primary: isDark ? '#f1f5f9' : '#0f172a', // slate-100/slate-900
          secondary: isDark ? '#94a3b8' : '#64748b', // slate-400/slate-500
        },
        divider: isDark ? '#334155' : '#e2e8f0', // slate-700/slate-200
      },
      typography: {
        fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
        fontSize: 14,
      },
      components: {
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundColor: isDark ? '#1e293b' : '#f8fafc',
            },
          },
        },
        MuiTooltip: {
          styleOverrides: {
            tooltip: {
              backgroundColor: isDark ? '#1e293b' : '#0f172a',
              color: isDark ? '#f1f5f9' : '#ffffff',
              fontSize: '12px',
            },
          },
        },
      },
    })
  }, [resolvedTheme])

  return (
    <MuiThemeProvider theme={muiTheme}>
      {children}
    </MuiThemeProvider>
  )
}
