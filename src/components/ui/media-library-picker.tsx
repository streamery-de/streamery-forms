"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Image, X } from "lucide-react"
import { __ } from "@/lib/i18n"

interface MediaLibraryPickerProps {
  value?: string
  onChange: (url: string) => void
  label?: string
  description?: string
}

declare global {
  interface Window {
    wp?: {
      media: any
    }
  }
}

export function MediaLibraryPicker({
  value = '',
  onChange,
  label,
  description,
}: MediaLibraryPickerProps) {
  const [imageUrl, setImageUrl] = useState(value)

  useEffect(() => {
    setImageUrl(value)
  }, [value])

  const openMediaLibrary = () => {
    // Wait for wp.media to be available
    const checkAndOpen = () => {
      if (typeof window === 'undefined') {
        return
      }

      const wp = (window as any).wp
      if (!wp || !wp.media) {
        // Try again after a short delay
        setTimeout(checkAndOpen, 100)
        return
      }

      // Create media uploader
      const mediaUploader = wp.media({
        title: __('selectImage', 'streamery-forms') || 'Select Image',
        button: {
          text: __('useThisImage', 'streamery-forms') || 'Use this image',
        },
        multiple: false,
        library: {
          type: 'image',
        },
      })

      mediaUploader.on('select', () => {
        const attachment = mediaUploader.state().get('selection').first().toJSON()
        const url = attachment.url || ''
        setImageUrl(url)
        onChange(url)
        mediaUploader.close()
      })

      mediaUploader.on('close', () => {
        // Cleanup
        mediaUploader.off('select')
        mediaUploader.off('close')
      })

      mediaUploader.open()
    }

    checkAndOpen()
  }

  const removeImage = () => {
    setImageUrl('')
    onChange('')
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="flex gap-2">
        <Input
          type="url"
          value={imageUrl}
          onChange={(e) => {
            setImageUrl(e.target.value)
            onChange(e.target.value)
          }}
          placeholder="https://example.com/logo.png"
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          onClick={openMediaLibrary}
          className="shrink-0"
        >
          <Image className="h-4 w-4 mr-2" />
          {__("selectFromMediaLibrary") || "Select"}
        </Button>
        {imageUrl && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={removeImage}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {imageUrl && (
        <div className="mt-2 border rounded-lg p-2">
          <img
            src={imageUrl}
            alt="Preview"
            className="max-w-full h-auto max-h-32 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
      )}
    </div>
  )
}

