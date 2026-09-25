import { type BlockEditProps } from '@wordpress/blocks';
import { type RadioAttributes } from '@/blockTypes/radio';
import './editor.css';
import { useUniqueID } from '../../lib/use-unique-id';
import { useNameFromLabel } from '../../lib/use-name-from-label';
import { RadioInspectorControls } from './inspector-controls';
import { FieldWrapper } from '../../components/block-atoms/FieldWrapper';
import { getFieldClasses, cn } from '../../lib/utils';
import { __ } from '@/lib/i18n';

export default function Edit(props: BlockEditProps<RadioAttributes>) {
	const { attributes, setAttributes, clientId } = props;

	useUniqueID(attributes.id, clientId, setAttributes);

	useNameFromLabel(
		attributes.label,
		attributes.name,
		(name) => setAttributes({ name }),
		attributes.useCustomName || false
	);

	const options = attributes.options || [];
	const styleVariant = attributes.styleVariant || 'default';
	const layout = attributes.layout || 'vertical';

	return (
		<>
			<RadioInspectorControls {...props} />
			<FieldWrapper
				className={cn(
					getFieldClasses(attributes),
					'streamery-forms-field--radio',
					`streamery-forms-field--radio-${styleVariant}`,
					`streamery-forms-field--layout-${layout}`,
				)}
				label={attributes.label}
				onLabelChange={(label) => setAttributes({ label })}
				help={attributes.help}
				onHelpChange={(help) => setAttributes({ help })}
				attributes={attributes}
			>
				<div
					className={`streamery-forms-radio-options streamery-forms-radio--${styleVariant} streamery-forms-radio--layout-${layout}`}
					role="radiogroup"
					aria-label={attributes.label || __('options')}
				>
					{options.length === 0 ? (
						<span className="streamery-forms-radio-placeholder">
							{__('addOptionsInSidebar')}
						</span>
					) : (
						options.map((option, index) => (
							<label
								key={index}
								className={cn(
									'streamery-forms-radio-option',
									option.imageUrl && 'streamery-forms-radio-option--has-image'
								)}
								htmlFor={`${attributes.id}-${index}`}
							>
								<input
									type="radio"
									disabled
									name={attributes.name}
									value={option.value}
									id={`${attributes.id}-${index}`}
									readOnly
								/>
								<span className="streamery-forms-radio-option-content">
									{option.imageUrl && (
										<img
											className="streamery-forms-radio-option-image"
											src={option.imageUrl}
											alt={option.imageAlt || ''}
										/>
									)}
									<span className="streamery-forms-radio-option-label">
										{option.label}
									</span>
									{option.description && (
										<span className="streamery-forms-radio-option-description">
											{option.description}
										</span>
									)}
								</span>
							</label>
						))
					)}
					{attributes.allowCustomOption && (
						<label className="streamery-forms-radio-option streamery-forms-radio-option--custom">
							<input type="radio" disabled checked={false} readOnly />
							<span className="streamery-forms-radio-option-content">
								<input
									type="text"
									className="streamery-forms-custom-option-input"
									placeholder={attributes.customOptionLabel || __('customOptionDefault', 'Other…')}
									disabled
								/>
							</span>
						</label>
					)}
				</div>
			</FieldWrapper>
		</>
	);
}
