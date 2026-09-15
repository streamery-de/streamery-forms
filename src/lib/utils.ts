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
    attributes.mode && `streamery-forms-field--datetime-mode-${attributes.mode}`,
    attributes.range === true && 'streamery-forms-field--range'
  )
}
