"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckIcon, CopyIcon } from "lucide-react";
import type { ComponentProps, HTMLAttributes, ReactNode } from "react";
import { createContext, useContext, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";

type CodeBlockContextType = {
  code: string;
};

const CodeBlockContext = createContext<CodeBlockContextType>({
  code: "",
});

export type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string;
  language: string;
  filename?: string;
  showLineNumbers?: boolean;
  children?: ReactNode;
};

export const CodeBlock = ({
  code,
  language,
  filename,
  showLineNumbers = false,
  className,
  children,
  ...props
}: CodeBlockProps) => (
  <CodeBlockContext.Provider value={{ code }}>
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700",
        className
      )}
      {...props}
    >
      {/* Header with filename and copy button */}
      <div className="flex items-center justify-between rounded-t-lg border-b border-gray-200 bg-gray-100 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          {filename && (
            <span className="font-mono text-xs font-medium text-gray-700 dark:text-gray-300">
              {filename}
            </span>
          )}
          {!filename && language && (
            <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
              {language}
            </span>
          )}
        </div>
        {children && (
          <div className="flex items-center gap-2">
            {children}
          </div>
        )}
      </div>

      {/* Code content */}
      <div className="relative">
        <SyntaxHighlighter
          className="overflow-hidden dark:hidden"
          codeTagProps={{
            className: "font-mono text-[13px] leading-6",
          }}
          customStyle={{
            margin: 0,
            padding: "1rem",
            fontSize: "13px",
            lineHeight: "1.5",
            background: "#f9fafb",
            color: "#111827",
            border: "none",
            borderRadius: "0 0 0.5rem 0.5rem",
          }}
          language={language}
          lineNumberStyle={{
            color: "#6b7280",
            paddingRight: "0.5rem",
            marginRight: "0.5rem",
            minWidth: "2rem",
            textAlign: "right",
            userSelect: "none",
            paddingLeft: "0.3rem",
          }}
          showLineNumbers={showLineNumbers}
          style={oneLight}
        >
          {code}
        </SyntaxHighlighter>
        <SyntaxHighlighter
          className="hidden overflow-hidden dark:block"
          codeTagProps={{
            className: "font-mono text-[13px] leading-6",
          }}
          customStyle={{
            margin: 0,
            padding: "1rem",
            fontSize: "13px",
            lineHeight: "1.5",
            background: "#0a0a0a",
            color: "#ffffff",
            border: "none",
            borderRadius: "0 0 0.5rem 0.5rem",
          }}
          language={language}
          lineNumberStyle={{
            color: "#6b7280",
            paddingRight: "0.5rem",
            minWidth: "2rem",
            textAlign: "right",
            userSelect: "none",
            paddingLeft: "0.5rem",
          }}
          showLineNumbers={showLineNumbers}
          style={oneDark}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  </CodeBlockContext.Provider>
);

export type CodeBlockCopyButtonProps = ComponentProps<typeof Button> & {
  onCopy?: () => void;
  onError?: (error: Error) => void;
  timeout?: number;
  iconOnly?: boolean;
};

export const CodeBlockCopyButton = ({
  onCopy,
  onError,
  timeout = 2000,
  iconOnly = false,
  children,
  className,
  ...props
}: CodeBlockCopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const { code } = useContext(CodeBlockContext);

  const copyToClipboard = async () => {
    if (typeof window === "undefined" || !navigator.clipboard.writeText) {
      onError?.(new Error("Clipboard API not available"));
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      onCopy?.();
      setTimeout(() => setIsCopied(false), timeout);
    } catch (error) {
      onError?.(error as Error);
    }
  };

  const Icon = isCopied ? CheckIcon : CopyIcon;

  return (
    <button
      className={cn(
        iconOnly
          ? "flex h-8 w-8 items-center justify-center rounded-md text-gray-600 transition-all hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800"
          : "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-gray-600 transition-all hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800",
        className
      )}
      onClick={copyToClipboard}
      aria-label="Copy code"
      title={isCopied ? "Copied!" : "Copy"}
      {...props}
    >
      <Icon size={14} />
      {!iconOnly && (isCopied ? "Copied!" : "Copy")}
    </button>
  );
};
