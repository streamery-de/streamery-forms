"use client"

import * as React from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const STORAGE_PREFIX = "streamery-forms-inbox-"

function getStoredOpen(storageKey: string, defaultOpen: boolean): boolean {
  if (typeof window === "undefined") return defaultOpen
  try {
    const stored = localStorage.getItem(storageKey)
    if (stored === null) return defaultOpen
    // we store collapsed state: "true" = collapsed = content closed = !open
    return stored !== "true"
  } catch {
    return defaultOpen
  }
}

function setStoredOpen(storageKey: string, open: boolean) {
  if (typeof window === "undefined") return
  try {
    // store collapsed state so "true" = collapsed
    localStorage.setItem(storageKey, open ? "false" : "true")
  } catch {
    // ignore
  }
}

interface CollapsibleSectionProps {
  title: string
  storageKey: string
  defaultOpen?: boolean
  isCollapsed: boolean
  children: React.ReactNode
}

export function CollapsibleSection({
  title,
  storageKey,
  defaultOpen = false,
  isCollapsed,
  children,
}: CollapsibleSectionProps) {
  const fullKey = storageKey.startsWith(STORAGE_PREFIX) ? storageKey : `${STORAGE_PREFIX}${storageKey}`
  const [open, setOpen] = React.useState(() => getStoredOpen(fullKey, defaultOpen))

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      setOpen(next)
      setStoredOpen(fullKey, next)
    },
    [fullKey]
  )

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <div className="flex h-9 items-center justify-center px-2">
            <span className="text-muted-foreground text-xs truncate" title={title}>
              {title}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">{title}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Collapsible open={open} onOpenChange={handleOpenChange}>
      <CollapsibleTrigger
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
      >
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0" />
        )}
        <span className="truncate">{title}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  )
}
