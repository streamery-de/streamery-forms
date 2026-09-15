import { useBlockProps } from '@wordpress/block-editor';
import { type BlockSaveProps } from '@wordpress/blocks';
import { type SaveProgressAttributes } from '@/blockTypes/save-progress';

export default function save(props: BlockSaveProps<SaveProgressAttributes>) {
	const blockProps = useBlockProps.save({
		className: 'streamery-forms-save-progress',
	});

	return (
		<div { ...blockProps }>
			<button
				type="button"
				className="streamery-forms-save-progress-btn"
				data-action="save-progress"
			>
				<span>{props.attributes.label}</span>
			</button>
		</div>
	);
}
