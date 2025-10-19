"use client"

import * as React from "react"
import { WebPreview, WebPreviewNavigation, WebPreviewNavigationButton, WebPreviewUrl, WebPreviewBody } from "./web-preview"
import { RefreshCcw, ExternalLink, Maximize2, Minimize2 } from "lucide-react"

export type ChartEmbedProps = React.HTMLAttributes<HTMLDivElement> & {
  embedUrl: string
  height?: number
}

export function ChartEmbed({ embedUrl, height = 420, ...props }: ChartEmbedProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [refreshKey, setRefreshKey] = React.useState(0)
  const iframeRef = React.useRef<HTMLIFrameElement>(null)

  const handleRefresh = () => {
    // Force iframe reload by updating the key
    setRefreshKey(prev => prev + 1)
  }

  const handleOpenInNewWindow = () => {
    window.open(embedUrl, '_blank', 'noopener,noreferrer')
  }

  const handleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div {...props}>
      <WebPreview defaultUrl={embedUrl} key={refreshKey}>
        <WebPreviewNavigation>
          <WebPreviewNavigationButton
            tooltip="Refresh chart"
            onClick={handleRefresh}
          >
            <RefreshCcw className="size-4" />
          </WebPreviewNavigationButton>
          
          <WebPreviewUrl />
          
          <WebPreviewNavigationButton
            tooltip="Open in new window"
            onClick={handleOpenInNewWindow}
          >
            <ExternalLink className="size-4" />
          </WebPreviewNavigationButton>
          
          <WebPreviewNavigationButton
            tooltip={isExpanded ? "Minimize" : "Expand"}
            onClick={handleExpand}
          >
            {isExpanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </WebPreviewNavigationButton>
        </WebPreviewNavigation>

        <WebPreviewBody
          style={{ height: isExpanded ? '600px' : height }}
          referrerPolicy="no-referrer"
          allow="fullscreen; clipboard-write"
        />
      </WebPreview>
    </div>
  )
}


