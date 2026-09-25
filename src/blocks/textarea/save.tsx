/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import { TextareaAttributes } from '@/blockTypes/textarea';
import { hasConditionalShowToOutput } from '@/blockTypes/conditionalLogic';
import { useBlockProps } from '@wordpress/block-editor';
import { type BlockSaveProps } from '@wordpress/blocks';
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
export default function save(props: BlockSaveProps<TextareaAttributes>) {
	const className = getFieldClasses(props.attributes);
	const conditionalShow = props.attributes.conditionalShow;
	return (
		<div
			{...useBlockProps.save({
				className,
				...(hasConditionalShowToOutput(conditionalShow) && { 'data-conditional-show': JSON.stringify(conditionalShow) }),
			})}
		>
			<label htmlFor={props.attributes.id}>{props.attributes.label}</label>
			<textarea rows={props.attributes.rows} placeholder={props.attributes.placeholder} name={props.attributes.name} id={props.attributes.id} required={props.attributes.required} value={props.attributes.defaultValue || undefined} aria-describedby={props.attributes.help ? `${props.attributes.id}-help` : undefined} />
			{props.attributes.help && <p className="streamery-forms-field__help" id={`${props.attributes.id}-help`}>{props.attributes.help}</p>}
		</div>
	);
}
