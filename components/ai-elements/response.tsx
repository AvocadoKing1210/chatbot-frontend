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
import { ChartTool } from "./chart-tool";

type ResponseProps = ComponentProps<typeof Streamdown> & {
  chartEnabled?: boolean;
};

export const Response = memo(
  ({ className, chartEnabled, ...props }: ResponseProps) => (
    <Streamdown
      className={cn(
        "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
      components={{
        table: ({ children, ...props }) => {
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

          const TableWithActions = () => {
            const ref = React.useRef<HTMLTableElement | null>(null);
            const [csv, setCsv] = React.useState<string>("");

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
                    {...props}
                  >
                    {children}
                  </table>
                </div>
              </div>
            );
          };

          return <TableWithActions />;
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
            
            const mode = language.toLowerCase().startsWith('py') ? 'python' : language.toLowerCase().startsWith('sql') ? 'sql' : 'sql'

            const CodeWithActions: React.FC = () => {
              const [showExec, setShowExec] = useState(false)
              const [showChart, setShowChart] = useState(false)
              const [isExecuting, setIsExecuting] = useState(false)
              return (
                <div className="space-y-3">
                  <CodeBlock 
                    code={codeContent}
                    language={language}
                    filename={filename}
                    showLineNumbers={true}
                    {...props}
                  >
                    <CodeBlockCopyButton iconOnly />
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
                  </CodeBlock>
                  {showExec && (
                    <>
                      <ExecutionTool 
                        mode={mode as 'sql' | 'python'} 
                        code={codeContent} 
                        autoRun={true}
                        onSuccess={() => {
                          setIsExecuting(false)
                          if (chartEnabled) {
                            setShowChart(true)
                          }
                        }}
                      />
                      {showChart && <ChartTool autoRun={true} />}
                    </>
                  )}
                </div>
              )
            }

            return <CodeWithActions />
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
            const codeElement = children.props as { className: string; children: any }
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

            const mode = language.toLowerCase().startsWith('py') ? 'python' : language.toLowerCase().startsWith('sql') ? 'sql' : 'sql'

            const CodeWithActions: React.FC = () => {
              const [showExec, setShowExec] = useState(false)
              const [showChart, setShowChart] = useState(false)
              const [isExecuting, setIsExecuting] = useState(false)
              return (
                <div className="space-y-3">
                  <CodeBlock 
                    code={codeContent}
                    language={language}
                    filename={filename}
                    showLineNumbers={true}
                  >
                    <CodeBlockCopyButton iconOnly />
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
                  </CodeBlock>
                  {showExec && (
                    <>
                      <ExecutionTool 
                        mode={mode as 'sql' | 'python'} 
                        code={codeContent} 
                        autoRun={true}
                        onSuccess={() => {
                          setIsExecuting(false)
                          if (chartEnabled) {
                            setShowChart(true)
                          }
                        }}
                      />
                      {showChart && <ChartTool autoRun={true} />}
                    </>
                  )}
                </div>
              )
            }

            return <CodeWithActions />
          }
          return <pre {...props}>{children}</pre>
        }
      }}
      {...props}
    />
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = "Response";
