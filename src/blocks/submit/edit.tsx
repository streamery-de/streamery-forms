import { __ } from "@/lib/i18n";
import { useBlockProps, RichText } from '@wordpress/block-editor';
import { type BlockEditProps } from '@wordpress/blocks';
import { type SubmitAttributes } from '@/blockTypes/submit';
import './editor.css';
import { useUniqueID } from '../../lib/use-unique-id';
import { SubmitInspectorControls } from './inspector-controls';

export default function Edit(props: BlockEditProps<SubmitAttributes>) {
	const { attributes, setAttributes, clientId } = props;

	// Automatically generate and set unique ID
	useUniqueID(attributes.id, clientId, setAttributes, 'streamery-forms-submit');

	return (
		<>
			<SubmitInspectorControls {...props} />
			<div { ...useBlockProps() }>
				<button type="submit" id={attributes.id}>
					<RichText
						tagName="span"
						value={attributes.label}
						onChange={(label) => setAttributes({ label })}
						placeholder={__('enterLabel')}
					/>
				</button>
			</div>
		</>
	);
}
