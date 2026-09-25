import { type BlockEditProps } from '@wordpress/blocks';
import { type SelectAttributes } from '@/blockTypes/select';
import './editor.css';
import { useUniqueID } from '../../lib/use-unique-id';
import { useNameFromLabel } from '../../lib/use-name-from-label';
import { SelectInspectorControls } from './inspector-controls';
import { FieldWrapper } from '../../components/block-atoms/FieldWrapper';
import { __ } from "@/lib/i18n";

export default function Edit(props: BlockEditProps<SelectAttributes>) {
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
			<SelectInspectorControls {...props} />
			<FieldWrapper
				label={attributes.label}
				onLabelChange={(label) => setAttributes({ label })}
				help={attributes.help}
				onHelpChange={(help) => setAttributes({ help })}
				attributes={attributes}
			>
				<select
					disabled
					value={attributes.optionsPopulated ? '' : attributes.defaultValue || ''}
					name={attributes.name}
					id={attributes.id}
					required={attributes.required}
				>
					{attributes.optionsPopulated ? (
						<option value="">{attributes.placeholder || __('selectAnOption')}</option>
					) : (
						<>
							{attributes.placeholder && (
								<option value="">
									{attributes.placeholder}
								</option>
							)}
							{attributes.options.map((option, index) => (
								<option key={index} value={option.value}>
									{option.label}
								</option>
							))}
						</>
					)}
				</select>
			</FieldWrapper>
		</>
	);
}

