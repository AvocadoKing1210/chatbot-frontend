"use client";

import { cn } from "@/lib/utils";
import React, { type ComponentProps, memo, useState } from "react";
import { Streamdown } from "streamdown";
import { InlineCode } from "./inline-code";
import { CodeBlock, CodeBlockCopyButton } from "./code-block";
import { CopyButton } from "@/components/ui/copy-button";
import { Button } from "@/components/ui/button";
import { Download, Play, Loader2 } from "lucide-react";
import { ExecutionTool } from "./execution-tool";
import { execTrace } from "@/lib/trace";

type ResponseProps = ComponentProps<typeof Streamdown> & {
  chartEnabled?: boolean;
};

function computeCodeHash(mode: string, codeContent: string): string {
  let h = 2166136261
  const s = `${mode}:${codeContent}`
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)
  }
  return (h >>> 0).toString(16)
}

type HoistedCodeWithActionsProps = {
  language: string
  codeContent: string
  filename?: string
  chartEnabled?: boolean
  codeBlockProps?: Record<string, unknown>
}

const HoistedCodeWithActions: React.FC<HoistedCodeWithActionsProps> = memo(({ language, codeContent, filename, codeBlockProps }) => {
  const mode = language.toLowerCase().startsWith('py') ? 'python' : language.toLowerCase().startsWith('sql') ? 'sql' : 'sql'
  const [showExec, setShowExec] = useState(() => {
    return Boolean((() => {
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem('exec_history_v1') : null
        if (!raw) return false
        const arr = JSON.parse(raw) as Array<{ codeHash: string; mode: string }>
        const hash = computeCodeHash(mode, codeContent)
        return arr.some(e => e.codeHash === hash && e.mode === mode)
      } catch {
        return false
      }
    })())
  })
  const [isExecuting, setIsExecuting] = useState(false)

  React.useEffect(() => {
    execTrace("Response.CodeWithActions mount", { mode, codeHashPreview: `${mode}:${String(codeContent).slice(0, 32)}` })
    return () => execTrace("Response.CodeWithActions unmount", { mode })
  }, [mode, codeContent])

  return (
    <div className="space-y-3">
      <CodeBlock 
        code={codeContent}
        language={language}
        filename={filename}
        showLineNumbers={true}
        {...(codeBlockProps || {})}
      >
        <CodeBlockCopyButton iconOnly />
        {mode === 'sql' && (
        <button
          className="flex h-8 w-8 items-center justify-center rounded-md text-gray-600 transition-all hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => {
            setShowExec(true)
            setIsExecuting(true)
          }}
          disabled={isExecuting}
          aria-label={isExecuting ? "Executing..." : "Execute"}
          title={isExecuting ? "Executing..." : "Execute"}
        >
          {isExecuting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Play size={14} />
          )}
        </button>
        )}
      </CodeBlock>
      {showExec && (
        <>
          <ExecutionTool 
            key={computeCodeHash(mode, codeContent)}
            mode={mode as 'sql' | 'python'} 
            code={codeContent} 
            shouldExecute={isExecuting}
            onSuccess={() => {
              setIsExecuting(false)
              // charts managed inside ExecutionTool now
            }}
            onComplete={() => setIsExecuting(false)}
          />
        </>
      )}
    </div>
  )
})

HoistedCodeWithActions.displayName = "HoistedCodeWithActions"

type TableWithActionsProps = React.HTMLAttributes<HTMLDivElement> & {
  tableProps?: React.TableHTMLAttributes<HTMLTableElement>
  children: React.ReactNode
}

const TableWithActions: React.FC<TableWithActionsProps> = memo(({ tableProps, children }) => {
  const ref = React.useRef<HTMLTableElement | null>(null);
  const [csv, setCsv] = React.useState<string>("");

  function tableToCsv(table: HTMLTableElement): string {
    const rows = Array.from(table.querySelectorAll("tr"));
    const csvRows = rows.map((row) => {
      const cells = Array.from(row.querySelectorAll("th,td"));
      const values = cells.map((cell) => {
        const text = (cell.textContent || "").trim();
        const needsQuotes = /[",\n]/.test(text);
        const escaped = text.replace(/"/g, '""');
        return needsQuotes ? `"${escaped}"` : escaped;
      });
      return values.join(",");
    });
    return csvRows.join("\n");
  }

  React.useEffect(() => {
    if (!ref.current) return;
    setCsv(tableToCsv(ref.current));
  }, []);

  const handleDownload = () => {
    if (!ref.current) return;
    const data = tableToCsv(ref.current);
    const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "table.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="my-2">
      <div className="mb-1 flex items-center justify-end gap-1">
        <CopyButton text={csv} tooltip="Copy table (CSV)" />
        <Button
          size="sm"
          variant="ghost"
          className="relative size-9 p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          onClick={handleDownload}
          title="Download CSV"
          aria-label="Download CSV"
        >
          <Download className="h-4 w-4" />
          <span className="sr-only">Download CSV</span>
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table
          ref={ref}
          className="w-full border-collapse border border-border rounded-lg overflow-hidden"
          {...tableProps}
        >
          {children}
        </table>
      </div>
    </div>
  );
})

TableWithActions.displayName = "TableWithActions"

export const Response = memo(
  ({ className, chartEnabled, ...props }: ResponseProps) => (
    <Streamdown
      className={cn(
        "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
      components={React.useMemo(() => ({
        table: ({ children, ...props }) => {
          return <TableWithActions tableProps={props}>{children}</TableWithActions>;
        },
        thead: ({ children, ...props }) => (
          <thead className="bg-muted/50" {...props}>
            {children}
          </thead>
        ),
        th: ({ children, ...props }) => (
          <th 
            className="border-b border-border px-4 py-2 text-left font-medium text-sm text-muted-foreground"
            {...props}
          >
            {children}
          </th>
        ),
        td: ({ children, ...props }) => (
          <td 
            className="border-b border-border px-4 py-2 text-sm"
            {...props}
          >
            {children}
          </td>
        ),
        tr: ({ children, ...props }) => (
          <tr 
            className="hover:bg-muted/50 [&:last-child_td]:border-b-0 [&:last-child_th]:border-b-0"
            {...props}
          >
            {children}
          </tr>
        ),
        code: ({ children, className, ...props }) => {
          // Code blocks (with language class)
          if (className && className.includes('language-')) {
            const language = className.replace('language-', '')
            const codeContent = typeof children === 'string' ? children : String(children)
            
            // Try to extract filename from the first line if it looks like a file path
            let filename: string | undefined
            const firstLine = codeContent.split('\n')[0]
            if (firstLine && (
              firstLine.includes('/') || 
              firstLine.includes('\\') || 
              firstLine.includes('.') ||
              firstLine.startsWith('//') ||
              firstLine.startsWith('#')
            )) {
              // Check if it's a comment with a file path
              const fileMatch = firstLine.match(/(?:^\/\/\s*|\/\/\s*|#\s*)(.+\.(js|ts|jsx|tsx|py|sql|css|html|json|md|yml|yaml|xml|sh|bash|zsh|fish|ps1|bat|cmd|go|rs|php|rb|java|c|cpp|h|hpp|cs|swift|kt|scala|r|m|pl|sh|sql|vue|svelte|astro|php|rb|py|go|rs|java|c|cpp|h|hpp|cs|swift|kt|scala|r|m|pl|sh|sql|vue|svelte|astro))/i)
              if (fileMatch) {
                filename = fileMatch[1].trim()
              }
            }
            return (
              <HoistedCodeWithActions 
                language={language} 
                codeContent={codeContent} 
                filename={filename}
                chartEnabled={chartEnabled}
                codeBlockProps={props}
              />
            )
          }
          // Inline code
          return <InlineCode className={className} {...props}>{children}</InlineCode>
        },
        pre: ({ children, ...props }) => {
          // Handle pre elements that contain code blocks
          if (React.isValidElement(children) && 
              children.props && 
              typeof children.props === 'object' && 
              'className' in children.props &&
              typeof children.props.className === 'string' &&
              children.props.className.includes('language-')) {
            const codeElement = children.props as { className: string; children: unknown }
            const language = codeElement.className.replace('language-', '')
            const codeContent = typeof codeElement.children === 'string' ? codeElement.children : String(codeElement.children)
            
            // Try to extract filename from the first line if it looks like a file path
            let filename: string | undefined
            const firstLine = codeContent.split('\n')[0]
            if (firstLine && (
              firstLine.includes('/') || 
              firstLine.includes('\\') || 
              firstLine.includes('.') ||
              firstLine.startsWith('//') ||
              firstLine.startsWith('#')
            )) {
              // Check if it's a comment with a file path
              const fileMatch = firstLine.match(/(?:^\/\/\s*|\/\/\s*|#\s*)(.+\.(js|ts|jsx|tsx|py|sql|css|html|json|md|yml|yaml|xml|sh|bash|zsh|fish|ps1|bat|cmd|go|rs|php|rb|java|c|cpp|h|hpp|cs|swift|kt|scala|r|m|pl|sh|sql|vue|svelte|astro|php|rb|py|go|rs|java|c|cpp|h|hpp|cs|swift|kt|scala|r|m|pl|sh|sql|vue|svelte|astro))/i)
              if (fileMatch) {
                filename = fileMatch[1].trim()
              }
            }
            return (
              <HoistedCodeWithActions 
                language={language} 
                codeContent={codeContent} 
                filename={filename}
                chartEnabled={chartEnabled}
              />
            )
          }
          return <pre {...props}>{children}</pre>
        }
      }), [chartEnabled])}
      {...props}
    />
  ),
  (prevProps, nextProps) => (
    prevProps.children === nextProps.children &&
    prevProps.chartEnabled === nextProps.chartEnabled
  )
);

Response.displayName = "Response";
