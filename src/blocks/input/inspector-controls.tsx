import { __ } from "@/lib/i18n";
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl, TextControl, ToggleControl, Notice } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { FieldControls } from '../../components/block-atoms/FieldControls';
import { ConditionalLogicControls } from '../../components/block-atoms/ConditionalLogicControls';
import { useFormBlocks } from './use-form-blocks';

import { type BlockEditProps } from '@wordpress/blocks';
import { type InputAttributes } from '@/blockTypes/input';

type InputInspectorControlsProps = BlockEditProps<InputAttributes>;

export const InputInspectorControls = ({ attributes, setAttributes, clientId }: InputInspectorControlsProps) => {
	const formBlocks = useFormBlocks(clientId || '');
	const { updateBlockAttributes } = useDispatch('core/block-editor');
	const isEmailType = attributes.type === 'email';
	
	// Check if another input block is already set as primary mail
	const hasOtherPrimaryMail = formBlocks.some(
		(block: any) => 
			block.clientId !== clientId && 
			block.attributes?.type === 'email' && 
			block.attributes?.isPrimaryMail === true
	);
	
	const handlePrimaryMailToggle = (value: boolean) => {
		if (value && hasOtherPrimaryMail) {
			// If setting to true and another field is already primary, unset the other one first
			formBlocks.forEach((block: any) => {
				if (block.clientId !== clientId && block.attributes?.isPrimaryMail === true) {
					updateBlockAttributes(block.clientId, { isPrimaryMail: false });
				}
			});
		}
		
		setAttributes({ isPrimaryMail: value });
	};
	
	return (
		<>
			<InspectorControls>
				<PanelBody title={__('inputFieldSettings', 'Input Field Settings')}>
					<SelectControl
						label={__('type', 'Type')}
						value={attributes.type as 'text' | 'number' | 'email' | 'tel' | 'url' | 'search' | undefined}
						onChange={(type) => setAttributes({ type: type as 'text' | 'number' | 'email' | 'tel' | 'url' | 'search' | undefined })}
						options={[
							{ label: __('text'), value: 'text' },
							{ label: __('number'), value: 'number' },
							{ label: __('email'), value: 'email' },
							{ label: __('phone'), value: 'tel' },
							{ label: __('url'), value: 'url' },
							{ label: __('search'), value: 'search' },
						]}
						__next40pxDefaultSize={true}
						__nextHasNoMarginBottom={true}
					/>
					<TextControl
						label={__('defaultValue', 'Default value')}
						help={__('defaultValueHelp', 'Prefilled in the field. Visitors can change it.')}
						type={attributes.type || 'text'}
						value={attributes.defaultValue || ''}
						onChange={(defaultValue) => setAttributes({ defaultValue })}
						__next40pxDefaultSize={true}
						__nextHasNoMarginBottom={true}
					/>

					{isEmailType && (
						<>
							<ToggleControl
								label={__("primaryMail")}
								checked={attributes.isPrimaryMail || false}
								onChange={handlePrimaryMailToggle}
								help={__("primaryMailDescription")}
								__nextHasNoMarginBottom={true}
							/>
							{hasOtherPrimaryMail && !attributes.isPrimaryMail && (
								<Notice status="warning" isDismissible={false}>
									{__("primaryMailWarning")}
								</Notice>
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
			<FieldControls
				attributes={attributes}
				setAttributes={setAttributes}
			/>	
		</>
	);
};

