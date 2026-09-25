import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl, TextControl, ToggleControl } from '@wordpress/components';
import { __ } from '@/lib/i18n';
import { FieldControls } from '../../components/block-atoms/FieldControls';
import { ConditionalLogicControls } from '../../components/block-atoms/ConditionalLogicControls';
import { LayoutOrientationControl } from '../../components/block-atoms/LayoutOrientationControl';
import { type BlockEditProps } from '@wordpress/blocks';
import { type RadioAttributes } from '@/blockTypes/radio';
import { OptionsRepeater } from '../../controls/OptionsRepeater';

type RadioInspectorControlsProps = BlockEditProps<RadioAttributes>;

const STYLE_OPTIONS = [
	{ value: 'default', label: __('radioStyleDefault', 'Standard') },
	{ value: 'toggle', label: __('radioStyleToggle', 'Schalter') },
	{ value: 'badges', label: __('radioStyleBadges', 'Badges') },
	{ value: 'cards', label: __('radioStyleCards', 'Karten') },
];

export const RadioInspectorControls = ({
	attributes,
	setAttributes,
	clientId,
}: RadioInspectorControlsProps) => {
	const options = attributes.options || [];

	const handleOptionsChange = (newOptions: typeof options) => {
		setAttributes({ options: newOptions });
	};

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('radioFieldSettings')}>
					<OptionsRepeater
						options={options}
						syncLabelValue={false}
						onChange={handleOptionsChange}
						onSyncLabelValueChange={() => {}}
						presets={[]}
						showDescription
						showImage
					/>
					<SelectControl
						label={__('style', 'Stil')}
						value={attributes.styleVariant || 'default'}
						options={STYLE_OPTIONS}
						onChange={(styleVariant: RadioAttributes['styleVariant']) =>
							setAttributes({ styleVariant })
						}
					/>
					<LayoutOrientationControl
						label={__('layout')}
						value={attributes.layout || 'vertical'}
						onChange={(layout: RadioAttributes['layout']) =>
							setAttributes({ layout })
						}
					/>
					<ToggleControl
						label={__('allowCustomOption', 'Allow custom option')}
						help={__('allowCustomOptionHelp', 'Adds a last option with a text field for the visitor\'s own answer.')}
						checked={attributes.allowCustomOption || false}
						onChange={(allowCustomOption) =>
							setAttributes({
								allowCustomOption,
								...(allowCustomOption && !attributes.customOptionLabel && {
									customOptionLabel: __('customOptionDefault', 'Other…'),
								}),
							})
						}
						__nextHasNoMarginBottom={true}
					/>
					{attributes.allowCustomOption && (
						<TextControl
							label={__('customOptionPlaceholder', 'Custom option placeholder')}
							value={attributes.customOptionLabel || ''}
							onChange={(customOptionLabel) => setAttributes({ customOptionLabel })}
							__next40pxDefaultSize={true}
							__nextHasNoMarginBottom={true}
						/>
					)}
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
