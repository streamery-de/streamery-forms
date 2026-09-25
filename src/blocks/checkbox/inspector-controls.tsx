import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl, TextControl, ToggleControl } from '@wordpress/components';
import { __ } from '@/lib/i18n';
import { FieldControls } from '../../components/block-atoms/FieldControls';
import { ConditionalLogicControls } from '../../components/block-atoms/ConditionalLogicControls';
import { LayoutOrientationControl } from '../../components/block-atoms/LayoutOrientationControl';
import { type BlockEditProps } from '@wordpress/blocks';
import { type CheckboxAttributes } from '@/blockTypes/checkbox';
import { OptionsRepeater } from '../../controls/OptionsRepeater';
import { getCheckboxOptionPresets } from './presets';

type CheckboxInspectorControlsProps = BlockEditProps<CheckboxAttributes>;

const STYLE_OPTIONS = [
	{ value: 'default', label: __('checkboxStyleDefault', 'Standard') },
	{ value: 'toggle', label: __('checkboxStyleToggle', 'Schalter') },
	{ value: 'cards', label: __('checkboxStyleCards', 'Karten') },
	{ value: 'badges', label: __('checkboxStyleBadges', 'Badges') },
];

export const CheckboxInspectorControls = ({
	attributes,
	setAttributes,
	clientId,
}: CheckboxInspectorControlsProps) => {
	const options = attributes.options || [];

	const handleOptionsChange = (newOptions: typeof options) => {
		setAttributes({ options: newOptions });
	};

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('checkboxFieldSettings')}>
					<OptionsRepeater
						options={options}
						syncLabelValue={false}
						onChange={handleOptionsChange}
						onSyncLabelValueChange={() => {}}
						presets={attributes.isConsent ? [] : getCheckboxOptionPresets()}
						showDescription
						showImage
					/>
					<SelectControl
						label={__('style', 'Stil')}
						value={attributes.styleVariant || 'default'}
						options={STYLE_OPTIONS}
						onChange={(styleVariant: CheckboxAttributes['styleVariant']) =>
							setAttributes({ styleVariant })
						}
					/>
					<LayoutOrientationControl
						label={__('layout')}
						value={attributes.layout || 'vertical'}
						onChange={(layout: CheckboxAttributes['layout']) =>
							setAttributes({ layout })
						}
					/>
					{!attributes.isConsent && (
						<>
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
						</>
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
