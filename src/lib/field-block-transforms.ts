/**
 * Shared utility functions for field block transforms.
 * Used to convert between Input, Textarea, and Select blocks.
 */

import { createBlock } from '@wordpress/blocks'

/**
 * Common attributes shared by all field blocks.
 */
interface CommonFieldAttributes {
  label: string
  name: string
  id: string
  placeholder: string
  help: string
  required: boolean
  useCustomName?: boolean
  useCustomId?: boolean
  defaultValue?: string
  conditionalShow?: object | null
}

/**
 * Input block attributes.
 */
interface InputAttributes extends CommonFieldAttributes {
  type: string
  isPrimaryMail?: boolean
}

/**
 * Textarea block attributes.
 */
interface TextareaAttributes extends CommonFieldAttributes {
  rows?: number
}

/**
 * Select block attributes.
 */
interface SelectAttributes extends CommonFieldAttributes {
  options: Array<{ label: string; value: string }>
  optionsPopulated: boolean
  syncLabelValue: boolean
}

/**
 * Checkbox block attributes.
 */
interface CheckboxAttributes extends CommonFieldAttributes {
  options: Array<{ label: string; value: string }>
  styleVariant: 'default' | 'toggle' | 'cards' | 'badges'
  isConsent?: boolean
}

/**
 * Radio block attributes.
 */
interface RadioAttributes extends CommonFieldAttributes {
  options: Array<{ label: string; value: string }>
  styleVariant: 'default' | 'toggle' | 'badges' | 'cards'
  layout: 'horizontal' | 'vertical'
}

/**
 * Date/Time block attributes.
 */
interface DateTimeAttributes extends CommonFieldAttributes {
  mode: 'date' | 'time' | 'datetime'
  range: boolean
  defaultValueEnd?: string
  min?: string
  max?: string
}

/**
 * Slider block attributes.
 */
interface SliderAttributes extends CommonFieldAttributes {
  min: number
  max: number
  step: number
  range: boolean
  defaultValueStart?: number
  defaultValueEnd?: number
}

/**
 * Extracts common attributes from any field block.
 */
export function getCommonAttributes(attributes: any): Partial<CommonFieldAttributes> {
  return {
    label: attributes.label || '',
    name: attributes.name || '',
    id: attributes.id || '',
    placeholder: attributes.placeholder || '',
    help: attributes.help || '',
    required: attributes.required || false,
    useCustomName: attributes.useCustomName,
    useCustomId: attributes.useCustomId,
    defaultValue: attributes.defaultValue || '',
    conditionalShow: attributes.conditionalShow ?? null,
  }
}

/**
 * Transforms any field block to an Input block.
 */
export function transformToInput(
  attributes: any,
  targetType: string = 'text'
): any {
  const common = getCommonAttributes(attributes)

  return createBlock('streamery-forms/input', {
    ...common,
    type: targetType,
    isPrimaryMail: attributes.isPrimaryMail || false,
  } as InputAttributes)
}

/**
 * Transforms any field block to a Textarea block.
 */
export function transformToTextarea(attributes: any): any {
  const common = getCommonAttributes(attributes)

  return createBlock('streamery-forms/textarea', {
    ...common,
    rows: attributes.rows || 4,
  } as TextareaAttributes)
}

/**
 * Transforms any field block to a Select block.
 */
export function transformToSelect(attributes: any): any {
  const common = getCommonAttributes(attributes)

  // If source is a Select block, preserve options
  const options = attributes.options || [
    { label: 'Option 1', value: 'option1' },
    { label: 'Option 2', value: 'option2' },
  ]

  return createBlock('streamery-forms/select', {
    ...common,
    options: options,
    optionsPopulated: attributes.optionsPopulated || false,
    syncLabelValue: attributes.syncLabelValue || false,
  } as SelectAttributes)
}

const defaultOptions = [
  { label: 'Option 1', value: 'option1' },
  { label: 'Option 2', value: 'option2' },
]

/**
 * Transforms any field block to a Checkbox block.
 */
export function transformToCheckbox(attributes: any): any {
  const common = getCommonAttributes(attributes)
  const options = attributes.options || defaultOptions

  return createBlock('streamery-forms/checkbox', {
    ...common,
    options,
    styleVariant: attributes.styleVariant || 'default',
    layout: attributes.layout || 'vertical',
    isConsent: attributes.isConsent || false,
  } as CheckboxAttributes)
}

/**
 * Transforms any field block to a Radio block.
 */
export function transformToRadio(attributes: any): any {
  const common = getCommonAttributes(attributes)
  const options = attributes.options || defaultOptions

  return createBlock('streamery-forms/radio', {
    ...common,
    options,
    styleVariant: attributes.styleVariant || 'default',
    layout: attributes.layout || 'vertical',
  } as RadioAttributes)
}

/**
 * Transforms any field block to a Date/Time block.
 */
export function transformToDateTime(attributes: any): any {
  const common = getCommonAttributes(attributes)

  return createBlock('streamery-forms/date-time', {
    ...common,
    mode: attributes.mode || 'date',
    range: attributes.range || false,
    defaultValueEnd: attributes.defaultValueEnd || '',
    min: attributes.min || '',
    max: attributes.max || '',
  } as DateTimeAttributes)
}

/**
 * Transforms any field block to a Slider block.
 */
export function transformToSlider(attributes: any): any {
  const common = getCommonAttributes(attributes)

  return createBlock('streamery-forms/slider', {
    ...common,
    min: attributes.min ?? 0,
    max: attributes.max ?? 100,
    step: attributes.step ?? 1,
    range: attributes.range || false,
    defaultValueStart: attributes.defaultValueStart ?? attributes.min ?? 0,
    defaultValueEnd: attributes.defaultValueEnd ?? attributes.max ?? 100,
  } as SliderAttributes)
}

