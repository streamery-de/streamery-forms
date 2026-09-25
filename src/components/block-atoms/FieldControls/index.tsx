import { __ } from "@/lib/i18n";
import { TextControl, ToggleControl } from '@wordpress/components';
import { CopyableFieldControl } from '../CopyableFieldControl';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { FieldControlsProps } from './types';

export const FieldControls = ({
	attributes,
	setAttributes,
}: FieldControlsProps) => {
	return (
		<InspectorControls>
			<PanelBody title={__("globalFieldSettings")}>
			<CopyableFieldControl
				label={__("name")}
				value={attributes.name}
				onChange={(name) => setAttributes({ name })}
				useCustom={attributes.useCustomName || false}
				onUseCustomChange={(useCustomName) => setAttributes({ useCustomName })}
				customToggleLabel={__("useCustomName")}
			/>
			<CopyableFieldControl
				label={__("id")}
				value={attributes.id}
				onChange={(id) => setAttributes({ id })}
				useCustom={attributes.useCustomId || false}
				onUseCustomChange={(useCustomId) => setAttributes({ useCustomId })}
				customToggleLabel={__("useCustomId")}
			/>
			<TextControl
				label={__("placeholder")}
				value={attributes.placeholder}
				onChange={(placeholder) => setAttributes({ placeholder })}
				__next40pxDefaultSize={true}
				__nextHasNoMarginBottom={true}
			/>
			<ToggleControl
				label={__("required")}
				checked={attributes.required}
				onChange={(required) => setAttributes({ required })}
				__nextHasNoMarginBottom={true}
			/>
			<ToggleControl
				label={__("hideLabel", "Hide label")}
				help={__("hideLabelHelp", "The label stays readable for screen readers.")}
				checked={attributes.hideLabel || false}
				onChange={(hideLabel) => setAttributes({ hideLabel })}
				__nextHasNoMarginBottom={true}
			/>
			</PanelBody>
		</InspectorControls>
	);
};

