/**
 * Step lookup for the block editor. Steps no longer have to be direct children
 * of the form -- they may sit in columns, groups, … -- so every "which steps
 * does this form have?" question goes through here instead of filtering the
 * form's direct children.
 */
export const FORM_BLOCK = 'streamery-forms/form';
export const STEP_BLOCK = 'streamery-forms/step';

type BlockEditorSelectors = {
	getBlockParentsByBlockName: (clientId: string, blockName: string) => string[];
	getBlocks: (rootClientId?: string) => any[];
};

/** Client ID of the form a block sits in, at any depth. */
export function findFormClientId(selectors: BlockEditorSelectors, clientId: string): string | null {
	const forms = selectors.getBlockParentsByBlockName(clientId, FORM_BLOCK);
	return forms.length ? forms[forms.length - 1] : null;
}

/** All step blocks of a form in document order, however deeply nested. */
export function getFormStepBlocks(selectors: BlockEditorSelectors, formClientId: string): any[] {
	const steps: any[] = [];
	const walk = (blocks: any[]) => {
		blocks.forEach((block) => {
			if (block.name === STEP_BLOCK) {
				steps.push(block);
				return; // steps don't nest
			}
			if (block.innerBlocks?.length) {
				walk(block.innerBlocks);
			}
		});
	};
	walk(selectors.getBlocks(formClientId));
	return steps;
}
