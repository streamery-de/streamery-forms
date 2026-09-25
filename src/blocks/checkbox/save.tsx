import { CheckboxAttributes } from '@/blockTypes/checkbox';
import { hasConditionalShowToOutput } from '@/blockTypes/conditionalLogic';
import { useBlockProps } from '@wordpress/block-editor';
import { type BlockSaveProps } from '@wordpress/blocks';
import { getFieldClasses, cn } from '../../lib/utils';

export default function save(props: BlockSaveProps<CheckboxAttributes>) {
	const {
		options,
		name,
		id,
		required,
		label,
		help,
		conditionalShow,
		isConsent,
		defaultValue,
		styleVariant = 'default',
		layout = 'vertical',
		allowCustomOption = false,
		customOptionLabel = '',
	} = props.attributes;
	const className = cn(
		getFieldClasses(props.attributes),
		'streamery-forms-field--checkbox',
		`streamery-forms-field--checkbox-${styleVariant}`,
		`streamery-forms-field--layout-${layout}`
	);

	const defaultValues = defaultValue
		? defaultValue.split(',').map((v) => v.trim())
		: [];

	// A consent checkbox is a single control: its own <label> already names it,
	// so wrapping it in a fieldset would make a screen reader announce the text
	// twice. Only a real multi-option group becomes a fieldset/legend.
	const Wrapper = isConsent ? 'div' : 'fieldset';
	const GroupLabel = isConsent ? 'span' : 'legend';

	return (
		<Wrapper
			{...useBlockProps.save({
				className,
				...(hasConditionalShowToOutput(conditionalShow) && {
					'data-conditional-show': JSON.stringify(conditionalShow),
				}),
				...(isConsent && { 'data-consent': 'true' }),
				...(required && !isConsent && { 'data-at-least-one': 'true' }),
			})}
			aria-describedby={help ? `${id}-help` : undefined}
			aria-required={required && !isConsent ? 'true' : undefined}
		>
			{label && <GroupLabel className="streamery-forms-field__label">{label}</GroupLabel>}
			<div
				className={cn(
					'streamery-forms-checkbox-options',
					`streamery-forms-checkbox--${styleVariant}`,
					`streamery-forms-checkbox--layout-${layout}`
				)}
			>
				{options.map((option, index) => {
					const inputId = `${id}-${index}`;
					const checked = defaultValues.includes(option.value);
					const inputName = isConsent ? name : `${name}[]`;

					return (
						<label
							key={index}
							className={cn(
								'streamery-forms-checkbox-option',
								option.imageUrl && 'streamery-forms-checkbox-option--has-image'
							)}
							htmlFor={inputId}
						>
							<input
								type="checkbox"
								name={inputName}
								value={option.value}
								id={inputId}
								required={isConsent ? required : undefined}
								defaultChecked={checked}
								data-required={required ? 'true' : undefined}
							/>
							<span className="streamery-forms-checkbox-option-content">
								{option.imageUrl && (
									<img
										className="streamery-forms-checkbox-option-image"
										src={option.imageUrl}
										alt={option.imageAlt || ''}
										loading="lazy"
									/>
								)}
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
					);
				})}
				{allowCustomOption && !isConsent && (
					<label
						className="streamery-forms-checkbox-option streamery-forms-checkbox-option--custom"
						htmlFor={`${id}-custom`}
					>
						<input
							type="checkbox"
							name={`${name}[]`}
							value=""
							id={`${id}-custom`}
							data-custom-option="true"
							data-required={required ? 'true' : undefined}
						/>
						<span className="streamery-forms-checkbox-option-content">
							<input
								type="text"
								className="streamery-forms-custom-option-input"
								placeholder={customOptionLabel || undefined}
								aria-label={customOptionLabel || label || undefined}
								maxLength={200}
							/>
						</span>
					</label>
				)}
			</div>
			{help && <p className="streamery-forms-field__help" id={`${id}-help`}>{help}</p>}
		</Wrapper>
	);
}
