import { __ } from '@/lib/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, RangeControl, TextareaControl } from '@wordpress/components';
import { type BlockEditProps } from '@wordpress/blocks';
import { type TextareaAttributes } from '@/blockTypes/textarea';
import { FieldControls } from '../../components/block-atoms/FieldControls';
import { ConditionalLogicControls } from '../../components/block-atoms/ConditionalLogicControls';

type TextareaInspectorControlsProps = BlockEditProps<TextareaAttributes>;

export const TextareaInspectorControls = ({ attributes, setAttributes, clientId }: TextareaInspectorControlsProps) => {
	return (
		<>
			<InspectorControls>
				<PanelBody title={__('textareaFieldSettings', 'Textarea Field Settings')}>
					<RangeControl
						label={__('rows', 'Rows')}
						value={attributes.rows}
						onChange={(rows?: number) => setAttributes({ rows })}
						min={1}
						max={10}
						step={1}
						__next40pxDefaultSize={true}
						__nextHasNoMarginBottom={true}
					/>
					<TextareaControl
						label={__('defaultValue', 'Default value')}
						help={__('defaultValueHelp', 'Prefilled in the field. Visitors can change it.')}
						value={attributes.defaultValue || ''}
						onChange={(defaultValue) => setAttributes({ defaultValue })}
						__nextHasNoMarginBottom={true}
					/>
				</PanelBody>
			</InspectorControls>
			{clientId && (
				<ConditionalLogicControls
					clientId={clientId}
					conditionalShow={attributes.conditionalShow}
					setAttributes={setAttributes}
				/>
			)}
			<FieldControls attributes={attributes} setAttributes={setAttributes} />
		</>
	);
};

