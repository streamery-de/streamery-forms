import { type BlockEditProps } from '@wordpress/blocks';
import { type TextareaAttributes } from '@/blockTypes/textarea';
import './editor.css';
import { useUniqueID } from '../../lib/use-unique-id';
import { useNameFromLabel } from '../../lib/use-name-from-label';
import { TextareaInspectorControls } from './inspector-controls';
import { FieldWrapper } from '../../components/block-atoms/FieldWrapper';

export default function Edit(props: BlockEditProps<TextareaAttributes>) {
	const { attributes, setAttributes, clientId } = props;

	// Automatically generate and set unique ID
	useUniqueID(attributes.id, clientId, setAttributes);

	// Automatically generate name from label (unless custom name is enabled)
	useNameFromLabel(
		attributes.label,
		attributes.name,
		(name) => setAttributes({ name }),
		attributes.useCustomName || false
	);

	return (
		<>
			<TextareaInspectorControls {...props} />
			<FieldWrapper
				label={attributes.label}
				onLabelChange={(label) => setAttributes({ label })}
				help={attributes.help}
				onHelpChange={(help) => setAttributes({ help })}
				attributes={attributes}
			>
				<textarea
					disabled
					rows={attributes.rows}
					placeholder={attributes.placeholder}
					name={attributes.name}
					id={attributes.id}
					required={attributes.required}
					value={attributes.defaultValue || ''}
				/>
			</FieldWrapper>
		</>
	);
}
