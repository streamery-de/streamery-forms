import { useBlockProps } from '@wordpress/block-editor';
import { type BlockSaveProps } from '@wordpress/blocks';
import { type StepNavigationAttributes } from '@/blockTypes/step-navigation';

export default function save(props: BlockSaveProps<StepNavigationAttributes>) {
	const { attributes } = props;

	const justifyMap: Record<string, string> = {
		'left': 'flex-start',
		'center': 'center',
		'right': 'flex-end',
		'space-between': 'space-between',
	};

	const blockProps = useBlockProps.save({
		className: 'streamery-forms-step-navigation',
		style: {
			justifyContent: justifyMap[attributes.justification] || 'flex-start',
		},
	});

	return (
		<div { ...blockProps }>
			{attributes.showPrev && (
				<button
					type="button"
					className="streamery-forms-step-prev"
					data-action="prev"
				>
					<span>{attributes.prevLabel}</span>
				</button>
			)}
			<button
				type="button"
				className="streamery-forms-step-next"
				data-action="next"
			>
				<span>{attributes.nextLabel}</span>
			</button>
			<button
				type="submit"
				className="streamery-forms-step-submit"
				data-action="submit"
				style={{ display: 'none', pointerEvents: 'none' }}
			>
				<span className="streamery-forms-submit-spinner" aria-hidden="true" />
				<span className="streamery-forms-submit-text">{attributes.submitLabel}</span>
			</button>
		</div>
	);
}
