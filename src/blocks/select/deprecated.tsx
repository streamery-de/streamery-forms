import { SelectAttributes } from '@/blockTypes/select';
import { hasConditionalShowToOutput } from '@/blockTypes/conditionalLogic';
import { useBlockProps } from '@wordpress/block-editor';
import { type BlockSaveProps } from '@wordpress/blocks';
import { getFieldClasses } from '../../lib/utils';
import { __ } from "@/lib/i18n";
import metadata from './block.json';

/**
 * Save output before 1.0.9, which ignored defaultValue. Blocks whose default
 * already matched an option (e.g. copied over from the placeholder) would
 * otherwise fail block validation.
 */
function saveV1(props: BlockSaveProps<SelectAttributes>) {
	const className = getFieldClasses(props.attributes);
	const { optionsPopulated, options, placeholder, name, id, required, label, help, conditionalShow, defaultValueFromField } = props.attributes;

	return (
		<div
			{...useBlockProps.save({
				className,
				...(hasConditionalShowToOutput(conditionalShow) && { 'data-conditional-show': JSON.stringify(conditionalShow) }),
				...(defaultValueFromField && { 'data-default-value-from-field': defaultValueFromField }),
			})}
		>
			<label htmlFor={id}>{label}</label>
			<select
				name={name}
				id={id}
				required={required}
				aria-describedby={help ? `${id}-help` : undefined}
				{...(optionsPopulated ? { 'data-populated': 'true' } : {})}
			>
				{optionsPopulated ? (
					<option value="">{placeholder || __('selectAnOption')}</option>
				) : (
					<>
						{placeholder && (
							<option value="">
								{placeholder}
							</option>
						)}
						{options.map((option, index) => (
							<option key={index} value={option.value}>
								{option.label}
							</option>
						))}
					</>
				)}
			</select>
			{help && <p className="streamery-forms-field__help" id={`${id}-help`}>{help}</p>}
		</div>
	);
}

export default [
	{
		attributes: metadata.attributes,
		save: saveV1,
	},
];
