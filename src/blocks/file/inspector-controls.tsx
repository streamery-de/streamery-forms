import { __ } from "@/lib/i18n";
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, ToggleControl, TextControl, RangeControl } from '@wordpress/components';
import { FieldControls } from '../../components/block-atoms/FieldControls';
import { ConditionalLogicControls } from '../../components/block-atoms/ConditionalLogicControls';

import { type BlockEditProps } from '@wordpress/blocks';
import { type FileAttributes } from '@/blockTypes/file';

type FileInspectorControlsProps = BlockEditProps<FileAttributes>;

export const FileInspectorControls = ({ attributes, setAttributes, clientId }: FileInspectorControlsProps) => {
	// Get WordPress upload limit (in MB) - this will be passed from PHP
	const wpUploadLimit = (window as any).streamery_forms?.uploadLimit || 0;
	const maxFileSizeHint = wpUploadLimit > 0 
		? __('maxFileSizeHint', `Maximum: ${wpUploadLimit} MB (WordPress upload limit)`)
		: __('maxFileSizeHintDefault', 'Maximum file size is limited by WordPress upload settings');

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('fileUploadSettings', 'File Upload Settings')}>
					<ToggleControl
						label={__('allowMultipleFiles', 'Allow multiple files')}
						checked={attributes.multiple}
						onChange={(multiple) => setAttributes({ multiple })}
						__nextHasNoMarginBottom={true}
					/>
					
					{attributes.multiple && (
						<RangeControl
							label={__('maxFiles', 'Maximum number of files')}
							value={attributes.maxFiles}
							onChange={(maxFiles) => setAttributes({ maxFiles: maxFiles || 5 })}
							min={1}
							max={20}
							step={1}
							__next40pxDefaultSize={true}
							__nextHasNoMarginBottom={true}
						/>
					)}

					<TextControl
						label={__('acceptedFileTypes', 'Accepted file types')}
						value={attributes.acceptTypes}
						onChange={(acceptTypes) => setAttributes({ acceptTypes })}
						help={__('acceptTypesHelp', 'Comma-separated MIME types or file extensions (e.g., image/*,application/pdf,.doc,.docx)')}
						__next40pxDefaultSize={true}
						__nextHasNoMarginBottom={true}
					/>

					<TextControl
						label={__('maxFileSize', 'Maximum file size (MB)')}
						type="number"
						value={attributes.maxFileSize ? String(attributes.maxFileSize) : '0'}
						onChange={(value) => {
							const numValue = parseInt(value, 10);
							setAttributes({ maxFileSize: isNaN(numValue) ? 0 : numValue });
						}}
						help={maxFileSizeHint}
						__next40pxDefaultSize={true}
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
			<FieldControls
				attributes={attributes}
				setAttributes={setAttributes}
			/>	
		</>
	);
};

