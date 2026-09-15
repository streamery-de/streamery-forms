import { type BlockEditProps } from '@wordpress/blocks';
import { type CheckboxAttributes } from '@/blockTypes/checkbox';
import './editor.css';
import { useUniqueID } from '../../lib/use-unique-id';
import { useNameFromLabel } from '../../lib/use-name-from-label';
import { CheckboxInspectorControls } from './inspector-controls';
import { FieldWrapper } from '../../components/block-atoms/FieldWrapper';
import { getFieldClasses, cn } from '../../lib/utils';
import { __ } from '@/lib/i18n';

export default function Edit(props: BlockEditProps<CheckboxAttributes>) {
	const { attributes, setAttributes, clientId } = props;

	useUniqueID(attributes.id, clientId, setAttributes);

	useNameFromLabel(
		attributes.label,
		attributes.name,
		(name) => setAttributes({ name }),
		attributes.useCustomName || false
	);

	const options = attributes.options || [];
	const isConsent = attributes.isConsent || false;
	const styleVariant = attributes.styleVariant || 'default';
	const layout = attributes.layout || 'vertical';

	return (
		<>
			<CheckboxInspectorControls {...props} />
			<FieldWrapper
				className={cn(
					getFieldClasses(attributes),
					'streamery-forms-field--checkbox',
					`streamery-forms-field--checkbox-${styleVariant}`,
					`streamery-forms-field--layout-${layout}`,
				)}
				label={attributes.label}
				onLabelChange={(label) => setAttributes({ label })}
				help={attributes.help}
				onHelpChange={(help) => setAttributes({ help })}
				attributes={attributes}
			>
				<div
					className={`streamery-forms-checkbox-options streamery-forms-checkbox--${styleVariant} streamery-forms-checkbox--layout-${layout}`}
					role="group"
					aria-label={attributes.label || __('options')}
				>
					{options.length === 0 ? (
						<span className="streamery-forms-checkbox-placeholder">
							{__('addOptionsInSidebar')}
						</span>
					) : (
						options.map((option, index) => (
							<label
								key={index}
								className="streamery-forms-checkbox-option"
								htmlFor={`${attributes.id}-${index}`}
							>
								<input
									type="checkbox"
									disabled
									name={isConsent ? attributes.name : `${attributes.name}[]`}
									value={option.value}
									id={`${attributes.id}-${index}`}
									checked={false}
									readOnly
								/>
								<span className="streamery-forms-checkbox-option-content">
									<span className="streamery-forms-checkbox-option-label">
										{option.label}
									</span>
									{option.description && (
										<span className="streamery-forms-checkbox-option-description">
											{option.description}
										</span>
									)}
								</span>
							</label>
						))
					)}
				</div>
			</FieldWrapper>
		</>
	);
}
