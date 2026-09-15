import { type BlockEditProps } from '@wordpress/blocks';
import { type FileAttributes } from '@/blockTypes/file';
import './editor.css';
import { useUniqueID } from '../../lib/use-unique-id';
import { useNameFromLabel } from '../../lib/use-name-from-label';
import { FileInspectorControls } from './inspector-controls';
import { FieldWrapper } from '../../components/block-atoms/FieldWrapper';
import { __ } from '../../lib/i18n';

export default function Edit(props: BlockEditProps<FileAttributes>) {
	const { attributes, setAttributes, clientId } = props;

	// Automatically generate and set unique ID
	useUniqueID(attributes.id, clientId, setAttributes);

	// Automatically generate name from label (unless custom name is enabled)
	useNameFromLabel(
		attributes.label,
		attributes.name,
		(name) => setAttributes({ name }),
		attributes.useCustomName || false
	);

	return (
		<>
			<FileInspectorControls {...props} />
			<FieldWrapper
				label={attributes.label}
				onLabelChange={(label) => setAttributes({ label })}
				help={attributes.help}
				onHelpChange={(help) => setAttributes({ help })}
				attributes={attributes}
			>
				<div className="streamery-forms-file-upload-preview" style={{ pointerEvents: 'none' }}>
					<div className="streamery-forms-file-upload-zone">
						<div className="streamery-forms-file-upload-icon">
							<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
								<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
								<polyline points="17 8 12 3 7 8" />
								<line x1="12" y1="3" x2="12" y2="15" />
							</svg>
						</div>
						<p className="streamery-forms-file-upload-text">
							<span className="streamery-forms-file-upload-text-primary">{__('selectCsvFileToUpload', __('Select a file to upload'))}</span>
							<span className="streamery-forms-file-upload-text-secondary">{__('orDragAndDrop', __('or drag and drop it here'))}</span>
						</p>
					</div>
				</div>
			</FieldWrapper>
		</>
	);
}

