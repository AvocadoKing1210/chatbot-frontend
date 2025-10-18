"use client"

import * as React from "react"
import { ChartLine } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputFooter,
  PromptInputTools,
  PromptInputButton,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
} from "./prompt-input"

export interface SelectorOption {
  id: string
  name: string
  description?: string
  icon?: React.ReactNode
}

interface ChatInputProps {
  placeholder?: string
  onSend?: (message: string) => void
  disabled?: boolean
  className?: string
  // Selector configuration
  selectorOptions?: SelectorOption[]
  selectedValue?: string
  onSelectorChange?: (value: string) => void
  selectorLabel?: string
  showSelector?: boolean
  // Chart configuration
  showChart?: boolean
  chartEnabled?: boolean
  onChartToggle?: (enabled: boolean) => void
}

/**
 * ChatInput component - now a wrapper around PromptInput for backward compatibility
 * Provides the same interface as the original ChatInput but with enhanced functionality
 */
export function ChatInput({
  placeholder = "How can I help you today?",
  onSend,
  disabled = false,
  className,
  selectorOptions = [],
  selectedValue,
  onSelectorChange,
  selectorLabel = "Select",
  showSelector = false,
  showChart = false,
  chartEnabled = false,
  onChartToggle,
}: ChatInputProps) {
  return (
    <div className={cn("w-full", className)}>
      <PromptInput
        onSubmit={({ text, files }, event) => {
          if (text && text.trim() && onSend) {
            onSend(text.trim())
          }
        }}
      >
        <PromptInputTextarea 
          placeholder={placeholder}
          disabled={disabled}
        />
        <PromptInputFooter>
          <PromptInputTools>
            {showChart && (
              <PromptInputButton
                variant={chartEnabled ? "default" : "ghost"}
                onClick={() => onChartToggle?.(!chartEnabled)}
                disabled={disabled}
              >
                <ChartLine className="w-4 h-4" />
                <span>Chart</span>
              </PromptInputButton>
            )}
            
            {showSelector && selectorOptions.length > 0 && (
              <PromptInputModelSelect 
                value={selectedValue} 
                onValueChange={onSelectorChange}
              >
                <PromptInputModelSelectTrigger>
                  <div className="flex items-center gap-2">
                    {selectedValue && selectorOptions.find(opt => opt.id === selectedValue)?.icon && (
                      <span className="flex items-center justify-center w-4 h-4">
                        {selectorOptions.find(opt => opt.id === selectedValue)?.icon}
                      </span>
                    )}
                    <span className="text-sm font-medium">
                      {selectedValue ? selectorOptions.find(opt => opt.id === selectedValue)?.name : selectorLabel}
                    </span>
                  </div>
                </PromptInputModelSelectTrigger>
                <PromptInputModelSelectContent>
                  {selectorOptions.map((option) => (
                    <PromptInputModelSelectItem
                      key={option.id}
                      value={option.id}
                    >
                      <div className="flex items-center gap-2">
                        {option.icon && (
                          <span className="flex items-center justify-center w-4 h-4">
                            {option.icon}
                          </span>
                        )}
                        <div className="flex flex-col">
                          <span>{option.name}</span>
                          {option.description && (
                            <span className="text-xs text-muted-foreground">
                              {option.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </PromptInputModelSelectItem>
                  ))}
                </PromptInputModelSelectContent>
              </PromptInputModelSelect>
            )}
          </PromptInputTools>
          <PromptInputSubmit disabled={disabled} />
        </PromptInputFooter>
      </PromptInput>
      
      <div className="mt-2 text-xs text-muted-foreground text-center">
        Press Enter to send · Shift + Enter for newline
      </div>
    </div>
  )
}
