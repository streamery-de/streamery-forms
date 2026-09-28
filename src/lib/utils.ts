import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getFormClasses = (attributes: any) => {
  return cn(
    'streamery-forms-form',
    attributes.successView && 'streamery-forms-form--success-view'
  )
}

export const getFieldClasses = (attributes: any) => {
  return cn(
    'streamery-forms-field',
    attributes.type && `streamery-forms-field-type--${attributes.type.toLowerCase()}`,
    attributes.required && 'streamery-forms-field--required',
    attributes.hideLabel && 'streamery-forms-field--label-hidden',
    attributes.mode && `streamery-forms-field--datetime-mode-${attributes.mode}`,
    attributes.range === true && 'streamery-forms-field--range'
  )
}

/**
 * Submission data minus internal metadata. Keys starting with "_" (e.g.
 * _primary_mail_field) are bookkeeping written by the frontend, not fields.
 */
export const visibleEntryFields = (data: Record<string, unknown> | null | undefined) =>
  Object.entries(data || {}).filter(([key]) => !key.startsWith('_'))

/** Field label for display: "checkboxes[]" -> "Checkboxes". */
export const formatFieldLabel = (key: string) => {
  const name = key.replace(/\[\]$/, '')
  return name.charAt(0).toUpperCase() + name.slice(1)
}
