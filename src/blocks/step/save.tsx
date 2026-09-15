import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import { type BlockSaveProps } from '@wordpress/blocks';
import { type StepAttributes } from '@/blockTypes/step';
import { hasConditionalShowToOutput } from '@/blockTypes/conditionalLogic';

export default function save(props: BlockSaveProps<StepAttributes>) {
	const conditionalShow = props.attributes.conditionalShow;
	const blockProps = useBlockProps.save({
		className: 'streamery-forms-step',
		'data-step-title': props.attributes.title || 'Step',
		...(hasConditionalShowToOutput(conditionalShow) && { 'data-conditional-show': JSON.stringify(conditionalShow) }),
	});

	return (
		<div {...blockProps}>
			<InnerBlocks.Content />
		</div>
	);
}
