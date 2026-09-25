/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import { InputAttributes } from '@/blockTypes/input';
import { hasConditionalShowToOutput } from '@/blockTypes/conditionalLogic';
import { useBlockProps } from '@wordpress/block-editor';
import { type BlockSaveProps } from '@wordpress/blocks';
import { dropPlaceholderCopy } from '../../lib/deprecations';
import metadata from './block.json';
import { getFieldClasses } from '../../lib/utils';

/**
 * The save function defines the way in which the different attributes should
 * be combined into the final markup, which is then serialized by the block
 * editor into `post_content`.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#save
 *
 * @return {Element} Element to render.
 */
/**
 * Save output up to 1.0.9. It passed defaultValue/defaultChecked, which the
 * block serializer does not turn into value/checked, so defaults never
 * reached the frontend.
 */
function saveV1(props: BlockSaveProps<InputAttributes>) {
	const className = getFieldClasses(props.attributes);
	const isPrimaryMail = props.attributes.type === 'email' && props.attributes.isPrimaryMail === true;
	const conditionalShow = props.attributes.conditionalShow;
	return (
		<div
			{...useBlockProps.save({
				className,
				...(hasConditionalShowToOutput(conditionalShow) && {
					'data-conditional-show': JSON.stringify(conditionalShow),
				}),
			})}
		>
			<label htmlFor={props.attributes.id}>{props.attributes.label}</label>
			<input 
				type={props.attributes.type} 
				placeholder={props.attributes.placeholder} 
				name={props.attributes.name} 
				id={props.attributes.id} 
				aria-describedby={props.attributes.help ? `${props.attributes.id}-help` : undefined}
				required={props.attributes.required} 
				defaultValue={props.attributes.defaultValue}
				data-primary-mail={isPrimaryMail ? 'true' : undefined}
			/>
			{props.attributes.help && <p className="streamery-forms-field__help" id={`${props.attributes.id}-help`}>{props.attributes.help}</p>}
		</div>
	);
}

export default [
	{
		attributes: metadata.attributes,
		save: saveV1,
		migrate: dropPlaceholderCopy,
	},
];
