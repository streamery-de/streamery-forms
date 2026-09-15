import { useState, useEffect, useCallback } from 'react'
import { useSelect } from '@wordpress/data'
import { extractFieldPlaceholders } from '../lib/extract-placeholders'
import { apiGet, ApiResponse } from '../lib/api'

interface Provider {
  id: number
  settings: Record<string, any>
}

/**
 * Hook to validate provider settings against form fields.
 * Checks if all placeholders referenced in providers exist as form fields.
 */
export function useProviderValidation(
  providerIds: number[],
  formClientId: string
) {
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const [shouldShowDialog, setShouldShowDialog] = useState(false)

  // Get all blocks inside the form
  const formBlocks = useSelect(
    (select: any) => {
      if (!formClientId) return []
      return select('core/block-editor').getBlocks(formClientId)
    },
    [formClientId]
  )

  // Extract field names from form blocks
  const getFormFieldNames = useCallback(() => {
    const fieldNames = new Set<string>()

    // Recursively extract field names from blocks
    const extractFromBlocks = (blocks: any[]) => {
      blocks.forEach((block: any) => {
        // Check if block is a field block
        if (
          block.name === 'streamery-forms/input' ||
          block.name === 'streamery-forms/textarea' ||
          block.name === 'streamery-forms/select' ||
          block.name === 'streamery-forms/checkbox' ||
          block.name === 'streamery-forms/radio' ||
          block.name === 'streamery-forms/date-time' ||
          block.name === 'streamery-forms/slider'
        ) {
          const name = block.attributes?.name
          if (name && typeof name === 'string') {
            fieldNames.add(name.toLowerCase())
          }
        }

        // Recursively check inner blocks
        if (block.innerBlocks && block.innerBlocks.length > 0) {
          extractFromBlocks(block.innerBlocks)
        }
      })
    }

    extractFromBlocks(formBlocks)
    return fieldNames
  }, [formBlocks])

  // Check providers for missing fields
  const checkProviders = useCallback(async () => {
    if (providerIds.length === 0 || !formClientId) {
      setMissingFields([])
      setShouldShowDialog(false)
      return
    }

    setIsChecking(true)

    try {
      const formFieldNames = getFormFieldNames()
      const allMissingFields = new Set<string>()

      // Load settings for each provider
      for (const providerId of providerIds) {
        try {
          const response = await apiGet<ApiResponse<Provider>>(`providers/get/${providerId}`)
          
          if (response.success && response.data) {
            const providerSettings = response.data.settings || {}
            
            // Extract field placeholders from provider settings
            const placeholders = extractFieldPlaceholders(providerSettings)
            
            // Check which placeholders are missing
            placeholders.forEach(placeholder => {
              if (!formFieldNames.has(placeholder.toLowerCase())) {
                allMissingFields.add(placeholder)
              }
            })
          }
        } catch (error) {
          console.error(`Failed to load provider ${providerId}:`, error)
        }
      }

      const missingArray = Array.from(allMissingFields)
      setMissingFields(missingArray)
      
      // Show dialog if there are missing fields
      if (missingArray.length > 0) {
        setShouldShowDialog(true)
      } else {
        setShouldShowDialog(false)
      }
    } catch (error) {
      console.error('Error checking providers:', error)
      setMissingFields([])
      setShouldShowDialog(false)
    } finally {
      setIsChecking(false)
    }
  }, [providerIds, formClientId, getFormFieldNames])

  // Auto-check when providerIds or formBlocks change
  useEffect(() => {
    if (providerIds.length > 0 && formClientId) {
      // Small delay to ensure blocks are updated
      const timeoutId = setTimeout(() => {
        checkProviders()
      }, 100)

      return () => clearTimeout(timeoutId)
    } else {
      setMissingFields([])
      setShouldShowDialog(false)
    }
  }, [providerIds, formClientId, checkProviders])

  return {
    missingFields,
    isChecking,
    shouldShowDialog,
    setShouldShowDialog,
    checkProviders,
  }
}

