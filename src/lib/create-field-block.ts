/**
 * Utility function for creating field blocks programmatically.
 */

import { createBlock } from '@wordpress/blocks';
import { cleanForSlug } from '@wordpress/url';

/**
 * Converts a slug to a human-readable label.
 * Example: "vorname" -> "Vorname", "first_name" -> "First Name"
 * 
 * @param slug - The slug to convert
 * @returns Human-readable label
 */
function slugToLabel(slug: string): string {
  if (!slug) return '';
  
  // Replace underscores and hyphens with spaces
  let label = slug.replace(/[_-]/g, ' ');
  
  // Capitalize first letter of each word
  label = label.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  return label;
}

/**
 * Creates an input block for a given field name.
 * The field name will be slugified and used as the name attribute.
 * A human-readable label will be generated from the slug.
 * 
 * @param fieldName - The field name (will be slugified if needed)
 * @param clientId - The client ID of the parent form block (for unique ID generation)
 * @returns Block instance ready to be inserted
 */
export function createFieldBlock(fieldName: string, clientId?: string): any {
  if (!fieldName) {
    throw new Error('Field name is required');
  }

  // Ensure field name is a valid slug
  const slug = cleanForSlug(fieldName) || fieldName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  
  // Generate label from slug
  const label = slugToLabel(slug);

  // Create unique ID (will be overridden by useUniqueID hook, but we need a placeholder)
  const uniqueId = `field-${slug}-${Date.now()}`;

  // Create block with default attributes
  const block = createBlock('streamery-forms/input', {
    label: label,
    name: slug,
    id: uniqueId,
    placeholder: '',
    help: '',
    required: false,
    useCustomName: false,
    useCustomId: false,
    type: 'text',
    defaultValue: '',
  });

  return block;
}

