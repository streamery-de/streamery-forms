import { useBlockProps } from '@wordpress/block-editor';
import { type BlockSaveProps } from '@wordpress/blocks';
import { type ProgressAttributes } from '@/blockTypes/progress';

export default function save(props: BlockSaveProps<ProgressAttributes>) {
	const blockProps = useBlockProps.save({
		className: `streamery-forms-progress streamery-forms-progress--${props.attributes.variant}`,
		'data-variant': props.attributes.variant,
	});

	return (
		<div { ...blockProps }>
			{/* Progress UI is built dynamically by view.ts */}
		</div>
	);
}
