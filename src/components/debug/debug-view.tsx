"use client"

import { useState, useEffect } from "react"
import { ChevronUp, ChevronDown, X, AlertCircle, CheckCircle2, XCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface DebugProvider {
  slug: string
  name: string
  feed_id?: number
  feed_name?: string
  status: 'success' | 'failed' | 'not_executed'
  settings?: Record<string, any>
}

interface DebugData {
  enabled: boolean
  timestamp: string
  form_identifier: string
  providers: DebugProvider[]
  payload: Record<string, any>
  errors: string[]
  results: Record<string, any>
}

interface DebugViewProps {
  debugData?: DebugData | null
}

export function DebugView({ debugData }: DebugViewProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (debugData && debugData.enabled) {
      setIsVisible(true)
      setIsExpanded(true)
      
      // Write to console
      console.group('🔍 Streamery Forms Debug Information')
      console.log('Form Identifier:', debugData.form_identifier)
      console.log('Timestamp:', debugData.timestamp)
      console.log('Providers:', debugData.providers)
      console.log('Payload:', debugData.payload)
      console.log('Results:', debugData.results)
      if (debugData.errors.length > 0) {
        console.error('Errors:', debugData.errors)
      }
      console.groupEnd()
    } else {
      setIsVisible(false)
    }
  }, [debugData])

  if (!isVisible || !debugData) {
    return null
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 dark:text-green-400'
      case 'failed':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]",
        "bg-background border rounded-lg shadow-lg",
        "transition-all duration-300 ease-in-out"
      )}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 border-b cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-500" />
          <span className="font-semibold text-sm">Debug View</span>
          {debugData.errors.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
              {debugData.errors.length} error{debugData.errors.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsVisible(false)
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="max-h-[600px] overflow-y-auto p-3 space-y-4 text-sm">
          {/* Form Info */}
          <div>
            <div className="font-semibold mb-1">Form Identifier</div>
            <div className="text-muted-foreground font-mono text-xs">{debugData.form_identifier}</div>
          </div>

          {/* Providers */}
          <div>
            <div className="font-semibold mb-2">Providers</div>
            <div className="space-y-2">
              {debugData.providers.map((provider, idx) => (
                <div key={idx} className="p-2 bg-muted rounded border">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(provider.status)}
                      <span className="font-medium">{provider.name}</span>
                    </div>
                    <span className={cn("text-xs", getStatusColor(provider.status))}>
                      {provider.status}
                    </span>
                  </div>
                  {provider.feed_name && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Feed: {provider.feed_name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Errors */}
          {debugData.errors.length > 0 && (
            <div>
              <div className="font-semibold mb-2 flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                Errors
              </div>
              <div className="space-y-1">
                {debugData.errors.map((error, idx) => (
                  <div key={idx} className="p-2 bg-red-50 dark:bg-red-900/20 rounded text-red-700 dark:text-red-300 text-xs">
                    {error}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payload */}
          <div>
            <div className="font-semibold mb-2">Payload</div>
            <pre className="p-2 bg-muted rounded text-xs overflow-x-auto font-mono">
              {JSON.stringify(debugData.payload, null, 2)}
            </pre>
          </div>

          {/* Results */}
          <div>
            <div className="font-semibold mb-2">Results</div>
            <pre className="p-2 bg-muted rounded text-xs overflow-x-auto font-mono">
              {JSON.stringify(debugData.results, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

