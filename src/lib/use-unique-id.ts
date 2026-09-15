import { useEffect } from "react"
import { useSelect } from "@wordpress/data"

/**
 * Generates a unique block ID for input blocks.
 * 
 * @param currentId - The current ID value (may be empty or undefined)
 * @param clientId - The WordPress block clientId
 * @param getAllBlockIds - Function that returns all existing block IDs on the page
 * @param prefix - The prefix for the ID (default: 'streamery-forms-input')
 * @returns A unique ID string
 */
export const generateUniqueBlockId = (
  currentId: string | undefined,
  clientId: string,
  getAllBlockIds: () => string[],
  prefix: string = 'streamery-forms-input'
): string => {
  // If no current ID, use the default pattern with clientId
  if (!currentId) {
    const defaultId = `${prefix}-${clientId}`;
    const existingIds = getAllBlockIds();
    
    // If default ID is already taken, append numbers
    if (existingIds.includes(defaultId)) {
      let counter = 1;
      let uniqueId = `${defaultId}-${counter}`;
      while (existingIds.includes(uniqueId)) {
        counter++;
        uniqueId = `${defaultId}-${counter}`;
      }
      return uniqueId;
    }
    
    return defaultId;
  }

  // Check if current ID matches the pattern [prefix]-[ID]
  const inputPattern = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(.+)$`);
  const match = currentId.match(inputPattern);
  
  if (match) {
    // If it matches the pattern, use clientId with the prefix
    const newId = `${prefix}-${clientId}`;
    const existingIds = getAllBlockIds();
    
    // If the new ID is already taken, append numbers
    if (existingIds.includes(newId)) {
      let counter = 1;
      let uniqueId = `${newId}-${counter}`;
      while (existingIds.includes(uniqueId)) {
        counter++;
        uniqueId = `${newId}-${counter}`;
      }
      return uniqueId;
    }
    
    return newId;
  }

  // If it doesn't match the pattern, check for duplicates and append numbers
  const existingIds = getAllBlockIds();
  if (!existingIds.includes(currentId)) {
    return currentId;
  }

  // ID is duplicate, append numbers until unique
  let counter = 1;
  let uniqueId = `${currentId}-${counter}`;
  while (existingIds.includes(uniqueId)) {
    counter++;
    uniqueId = `${currentId}-${counter}`;
  }
  
  return uniqueId;
}

/**
 * React hook that automatically generates and sets a unique block ID.
 * 
 * @param currentId - The current ID value from block attributes
 * @param clientId - The WordPress block clientId
 * @param setAttributes - Function to update block attributes
 * @param prefix - The prefix for the ID (default: 'streamery-forms-input')
 */
export const useUniqueID = (
  currentId: string | undefined,
  clientId: string,
  setAttributes: (attributes: { id: string }) => void,
  prefix: string = 'streamery-forms-input'
): void => {
  // Get all blocks to check for duplicate IDs
  const allBlocks = useSelect(
    (select: any) => select('core/block-editor').getBlocks(),
    []
  );

  useEffect(() => {
    // Extract all block IDs from blocks that have an 'id' attribute
    // Exclude the current block by clientId to avoid false positives
    const getAllBlockIds = () => {
      return allBlocks
        .filter((block: any) => block.clientId !== clientId) // Exclude current block
        .map((block: any) => {
          // Check if block has attributes with an 'id' field
          if (block.attributes?.id) {
            return block.attributes.id;
          }
          return null;
        })
        .filter((id: string | null): id is string => id !== null);
    };

    const existingIds = getAllBlockIds();
    
    const uniqueId = generateUniqueBlockId(
      currentId,
      clientId,
      () => existingIds,
      prefix
    );

    if (uniqueId !== currentId) {
      setAttributes({ id: uniqueId });
    }
  }, [currentId, clientId, allBlocks, setAttributes, prefix]);
}

