"use client";

import { cn } from "@/lib/utils";
import React, { type ComponentProps, memo } from "react";
import { Streamdown } from "streamdown";
import { InlineCode } from "./inline-code";
import { CodeBlock, CodeBlockCopyButton } from "./code-block";

type ResponseProps = ComponentProps<typeof Streamdown>;

export const Response = memo(
  ({ className, ...props }: ResponseProps) => (
    <Streamdown
      className={cn(
        "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
      components={{
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
              <CodeBlock 
                code={codeContent}
                language={language}
                filename={filename}
                showLineNumbers={true}
                {...props}
              >
                <CodeBlockCopyButton />
              </CodeBlock>
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
            
            return (
              <CodeBlock 
                code={codeContent}
                language={language}
                filename={filename}
                showLineNumbers={true}
              >
                <CodeBlockCopyButton />
              </CodeBlock>
            )
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
