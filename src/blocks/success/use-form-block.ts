import { useSelect } from '@wordpress/data';

/**
 * Hook to get the parent form block for a given block clientId
 */
export const useFormBlock = (clientId: string) => {
	return useSelect(
		(select: any) => {
			const { getBlockParents, getBlock } = select('core/block-editor');
			const parentIds = getBlockParents(clientId);
			
			// Find the form block parent
			for (const parentId of parentIds) {
				const parentBlock = getBlock(parentId);
				if (parentBlock?.name === 'streamery-forms/form') {
					return parentBlock;
				}
			}
			return null;
		},
		[clientId]
	);
};

