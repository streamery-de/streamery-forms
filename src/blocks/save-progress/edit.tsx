import { __ } from '@/lib/i18n';
import { useBlockProps, RichText } from '@wordpress/block-editor';
import { type BlockEditProps } from '@wordpress/blocks';
import { type SaveProgressAttributes } from '@/blockTypes/save-progress';
import './editor.css';

export default function Edit(props: BlockEditProps<SaveProgressAttributes>) {
	const { attributes, setAttributes } = props;

	const blockProps = useBlockProps({
		className: 'streamery-forms-save-progress',
	});

	return (
		<div { ...blockProps }>
			<button type="button" className="streamery-forms-save-progress-btn" disabled>
				<RichText
					tagName="span"
					value={attributes.label}
					onChange={(label) => setAttributes({ label })}
					placeholder={__('saveAndContinueLater')}
				/>
			</button>
		</div>
	);
}
