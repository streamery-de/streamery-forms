import { __ } from '@/lib/i18n';
import {
	// @ts-expect-error -- public export, missing from the bundled type definitions
	AlignmentControl,
	BlockControls,
	// @ts-expect-error -- public export since WP 6.4, missing from the bundled type definitions
	HeadingLevelDropdown,
	InspectorControls,
	useBlockProps,
} from '@wordpress/block-editor';
import { PanelBody, SelectControl, TextControl, ToggleControl } from '@wordpress/components';
import { type BlockEditProps } from '@wordpress/blocks';
import { type FieldValueAttributes } from '@/blockTypes/field-value';
import { useFormFieldList } from '@/hooks/useFormFieldList';
import { cn } from '../../lib/utils';

export default function Edit({ attributes, setAttributes, clientId }: BlockEditProps<FieldValueAttributes>) {
	const { sourceFieldName, level, textAlign, prefix, suffix, fallback, showOptionLabels } = attributes;
	const fields = useFormFieldList(clientId);
	const field = fields.find((f) => f.name === sourceFieldName);
	const TagName = (level > 0 ? `h${level}` : 'p') as 'p';

	const blockProps = useBlockProps({
		className: cn(textAlign && `has-text-align-${textAlign}`),
	});

	return (
		<>
			<BlockControls group="block">
				<HeadingLevelDropdown
					options={[0, 1, 2, 3, 4, 5, 6]}
					value={level}
					onChange={(newLevel: number) => setAttributes({ level: newLevel })}
				/>
				<AlignmentControl
					value={textAlign}
					onChange={(nextAlign: string | undefined) => setAttributes({ textAlign: nextAlign })}
				/>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={__('fieldValueSettings', 'Field value')}>
					<SelectControl
						label={__('fieldValueSource', 'Field')}
						value={sourceFieldName}
						options={[
							{ value: '', label: __('conditionalShowNone', '— None —') },
							...fields.map((f) => ({ value: f.name, label: f.label || f.name })),
						]}
						onChange={(value) => setAttributes({ sourceFieldName: value })}
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					/>
					<TextControl
						label={__('fieldValuePrefix', 'Text before')}
						help={__('fieldValueAffixHelp', 'Only shown together with a value.')}
						value={prefix}
						onChange={(value) => setAttributes({ prefix: value })}
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					/>
					<TextControl
						label={__('fieldValueSuffix', 'Text after')}
						value={suffix}
						onChange={(value) => setAttributes({ suffix: value })}
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					/>
					<TextControl
						label={__('fieldValueFallback', 'Fallback')}
						help={__('fieldValueFallbackHelp', 'Shown while the field is empty. Leave empty to hide the block until there is a value.')}
						value={fallback}
						onChange={(value) => setAttributes({ fallback: value })}
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					/>
					{field?.options && (
						<ToggleControl
							label={__('fieldValueShowLabels', 'Show option labels instead of values')}
							checked={showOptionLabels}
							onChange={(value) => setAttributes({ showOptionLabels: value })}
							__nextHasNoMarginBottom
						/>
					)}
				</PanelBody>
			</InspectorControls>
			<TagName {...blockProps}>
				{prefix && <span className="streamery-forms-field-value__prefix">{prefix}</span>}
				<span className="streamery-forms-field-value__value streamery-forms-field-value__placeholder">
					{field
						? `[${field.label || field.name}]`
						: __('fieldValueChooseField', 'Choose a field in the sidebar')}
				</span>
				{suffix && <span className="streamery-forms-field-value__suffix">{suffix}</span>}
			</TagName>
		</>
	);
}
