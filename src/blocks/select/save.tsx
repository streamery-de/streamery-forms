/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import { SelectAttributes } from '@/blockTypes/select';
import { hasConditionalShowToOutput } from '@/blockTypes/conditionalLogic';
import { useBlockProps } from '@wordpress/block-editor';
import { type BlockSaveProps } from '@wordpress/blocks';
import { getFieldClasses } from '../../lib/utils';
import { __ } from "@/lib/i18n";

/**
 * The save function defines the way in which the different attributes should
 * be combined into the final markup, which is then serialized by the block
 * editor into `post_content`.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#save
 *
 * @return {Element} Element to render.
 */
export default function save(props: BlockSaveProps<SelectAttributes>) {
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

