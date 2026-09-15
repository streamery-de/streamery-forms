import { useSelect } from '@wordpress/data';

/**
 * Hook to get all input blocks within the parent form block
 */
export const useFormBlocks = (clientId: string) => {
	return useSelect(
		(select: any) => {
			const { getBlockParents, getBlocks } = select('core/block-editor');
			const parentIds = getBlockParents(clientId);
			
			// Find the form block parent
			let formBlockId: string | null = null;
			for (const parentId of parentIds) {
				const parentBlock = select('core/block-editor').getBlock(parentId);
				if (parentBlock?.name === 'streamery-forms/form') {
					formBlockId = parentId;
					break;
				}
			}
			
			if (!formBlockId) {
				return [];
			}
			
			// Get all blocks within the form
			const allBlocks = getBlocks(formBlockId);
			
			// Recursively find all input blocks
			const findInputBlocks = (blocks: any[]): any[] => {
				const inputBlocks: any[] = [];
				
				for (const block of blocks) {
					if (block.name === 'streamery-forms/input') {
						inputBlocks.push(block);
					}
					
					// Recursively check inner blocks
					if (block.innerBlocks && block.innerBlocks.length > 0) {
						inputBlocks.push(...findInputBlocks(block.innerBlocks));
					}
				}
				
				return inputBlocks;
			};
			
			return findInputBlocks(allBlocks);
		},
		[clientId]
	);
};

