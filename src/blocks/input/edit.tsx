import { type BlockEditProps } from '@wordpress/blocks';
import { type InputAttributes } from '@/blockTypes/input';
import './editor.css';
import { useUniqueID } from '../../lib/use-unique-id';
import { useNameFromLabel } from '../../lib/use-name-from-label';
import { InputInspectorControls } from './inspector-controls';
import { FieldWrapper } from '../../components/block-atoms/FieldWrapper';

export default function Edit(props: BlockEditProps<InputAttributes>) {
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
			<InputInspectorControls {...props} />
			<FieldWrapper
				label={attributes.label}
				onLabelChange={(label) => setAttributes({ label })}
				help={attributes.help}
				onHelpChange={(help) => setAttributes({ help })}
				attributes={attributes}
			>
				<input
					disabled
					type={attributes.type}
					placeholder={attributes.placeholder}
					value={attributes.defaultValue || ''}
					name={attributes.name}
					id={attributes.id}
					required={attributes.required}
				/>
			</FieldWrapper>
		</>
	);
}
