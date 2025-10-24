"use client"

// Lightweight tracing helpers gated by env/localStorage
// Enable by setting NEXT_PUBLIC_EXEC_TRACE=1 (build-time) or localStorage.setItem('exec_trace','1') (runtime)

const ENV_FLAG = process.env.NEXT_PUBLIC_EXEC_TRACE

export function execTraceEnabled(): boolean {
  if (typeof window !== "undefined") {
    try {
      const v = window.localStorage?.getItem("exec_trace")
      if (v === "1" || v === "true") return true
    } catch {}
  }
  return ENV_FLAG === "1" || ENV_FLAG === "true"
}

export function execTrace(...args: unknown[]): void {
  if (!execTraceEnabled()) return
  try {
    console.log("[EXEC_TRACE]", ...args)
  } catch {}
}

export function execTraceGroupStart(label: string, data?: unknown): void {
  if (!execTraceEnabled()) return
  try {
    console.groupCollapsed(`[EXEC_TRACE] ${label}`, data ?? "")
  } catch {}
}

export function execTraceGroupEnd(): void {
  if (!execTraceEnabled()) return
  try {
    console.groupEnd()
  } catch {}
}

export function execMark(markName: string): void {
  if (!execTraceEnabled()) return
  try {
    performance.mark(markName)
  } catch {}
}


