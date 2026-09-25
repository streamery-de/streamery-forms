import { RadioAttributes } from '@/blockTypes/radio';
import { hasConditionalShowToOutput } from '@/blockTypes/conditionalLogic';
import { useBlockProps } from '@wordpress/block-editor';
import { type BlockSaveProps } from '@wordpress/blocks';
import { dropOptionPlaceholderCopy } from '../../lib/deprecations';
import metadata from './block.json';
import { getFieldClasses, cn } from '../../lib/utils';

/**
 * Save output up to 1.0.9. It passed defaultValue/defaultChecked, which the
 * block serializer does not turn into value/checked, so defaults never
 * reached the frontend.
 */
function saveV1(props: BlockSaveProps<RadioAttributes>) {
	const {
		options,
		name,
		id,
		required,
		label,
		help,
		conditionalShow,
		defaultValue,
		styleVariant = 'default',
		layout = 'vertical',
		imagePosition = 'top-left',
		inlineImagePosition = 'before',
		allowCustomOption = false,
		customOptionLabel = '',
	} = props.attributes;
	const className = cn(
		getFieldClasses(props.attributes),
		'streamery-forms-field--radio',
		`streamery-forms-field--radio-${styleVariant}`,
		`streamery-forms-field--layout-${layout}`,
		imagePosition === 'center' && styleVariant === 'cards' && 'streamery-forms-field--image-center',
		inlineImagePosition === 'after' && styleVariant !== 'cards' && 'streamery-forms-field--image-after'
	);

	return (
		// A group of radios is a native fieldset/legend, so the group's own
		// label is announced before the options instead of floating loose next
		// to them. aria-describedby ties the help text to the whole group.
		<fieldset
			{...useBlockProps.save({
				className,
				...(hasConditionalShowToOutput(conditionalShow) && {
					'data-conditional-show': JSON.stringify(conditionalShow),
				}),
			})}
			aria-describedby={help ? `${id}-help` : undefined}
			aria-required={required ? 'true' : undefined}
		>
			{label && <legend className="streamery-forms-field__label">{label}</legend>}
			<div
				className={cn(
					'streamery-forms-radio-options',
					`streamery-forms-radio--${styleVariant}`,
					`streamery-forms-radio--layout-${layout}`
				)}
			>
				{options.map((option, index) => {
					const inputId = `${id}-${index}`;
					const checked = defaultValue === option.value;

					return (
						<label
							key={index}
							className={cn(
								'streamery-forms-radio-option',
								option.imageUrl && 'streamery-forms-radio-option--has-image'
							)}
							htmlFor={inputId}
						>
							<input
								type="radio"
								name={name}
								value={option.value}
								id={inputId}
								required={required}
								defaultChecked={checked}
							/>
							<span className="streamery-forms-radio-option-content">
								{option.imageUrl && (
									<img
										className="streamery-forms-radio-option-image"
										src={option.imageUrl}
										alt={option.imageAlt || ''}
										loading="lazy"
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
					);
				})}
				{allowCustomOption && (
					<label
						className="streamery-forms-radio-option streamery-forms-radio-option--custom"
						htmlFor={`${id}-custom`}
					>
						<input
							type="radio"
							name={name}
							value=""
							id={`${id}-custom`}
							required={required}
							data-custom-option="true"
						/>
						<span className="streamery-forms-radio-option-content">
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
		</fieldset>
	);
}

export default [
	{
		attributes: metadata.attributes,
		save: saveV1,
		migrate: dropOptionPlaceholderCopy,
	},
];
