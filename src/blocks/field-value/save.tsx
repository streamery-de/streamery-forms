import { useBlockProps } from '@wordpress/block-editor';
import { type BlockSaveProps } from '@wordpress/blocks';
import { type FieldValueAttributes } from '@/blockTypes/field-value';
import { cn } from '../../lib/utils';

/**
 * The value itself is filled in on the frontend by the form's view script
 * (see updateFieldValueOutputs in src/blocks/form/view.ts); the saved markup
 * only carries the fallback.
 */
export default function save({ attributes }: BlockSaveProps<FieldValueAttributes>) {
	const { sourceFieldName, level, textAlign, prefix, suffix, fallback, showOptionLabels, valueBold } = attributes;
	const TagName = (level > 0 ? `h${level}` : 'p') as 'p';

	return (
		<TagName
			{...useBlockProps.save({
				className: cn(
					textAlign && `has-text-align-${textAlign}`,
					!fallback && 'is-empty',
					valueBold && 'has-bold-value'
				),
				'data-field-value': sourceFieldName,
				'data-field-value-labels': showOptionLabels ? 'true' : 'false',
			})}
		>
			{prefix && <span className="streamery-forms-field-value__prefix">{prefix}</span>}
			<span className="streamery-forms-field-value__value" data-fallback={fallback || undefined}>
				{fallback}
			</span>
			{suffix && <span className="streamery-forms-field-value__suffix">{suffix}</span>}
		</TagName>
	);
}
