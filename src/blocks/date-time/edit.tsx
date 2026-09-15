import { type BlockEditProps } from '@wordpress/blocks';
import { type DateTimeAttributes } from '@/blockTypes/date-time';
import './editor.css';
import { useUniqueID } from '../../lib/use-unique-id';
import { useNameFromLabel } from '../../lib/use-name-from-label';
import { DateTimeInspectorControls } from './inspector-controls';
import { FieldWrapper } from '../../components/block-atoms/FieldWrapper';

export default function Edit(props: BlockEditProps<DateTimeAttributes>) {
	const { attributes, setAttributes, clientId } = props;

	useUniqueID(attributes.id, clientId, setAttributes);

	useNameFromLabel(
		attributes.label,
		attributes.name,
		(name) => setAttributes({ name }),
		attributes.useCustomName || false
	);

	const mode = attributes.mode || 'date';
	const range = attributes.range || false;
	const inputType =
		mode === 'datetime' ? 'datetime-local' : (mode as 'date' | 'time');

	return (
		<>
			<DateTimeInspectorControls {...props} />
			<FieldWrapper
				label={attributes.label}
				onLabelChange={(label) => setAttributes({ label })}
				help={attributes.help}
				onHelpChange={(help) => setAttributes({ help })}
				attributes={attributes}
			>
				<div className="streamery-forms-datetime-inputs">
					<input
						type={inputType}
						disabled
						name={attributes.name}
						id={attributes.id}
						className="streamery-forms-datetime-input"
					/>
					{range && (
						<>
							<span className="streamery-forms-datetime-separator">–</span>
							<input
								type={inputType}
								disabled
								name={`${attributes.name}_end`}
								id={`${attributes.id}-end`}
								className="streamery-forms-datetime-input"
							/>
						</>
					)}
				</div>
			</FieldWrapper>
		</>
	);
}
