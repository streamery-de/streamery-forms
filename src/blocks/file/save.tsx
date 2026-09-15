/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import { FileAttributes } from '@/blockTypes/file';
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
export default function save(props: BlockSaveProps<FileAttributes>) {
	const className = getFieldClasses(props.attributes);
	const conditionalShow = props.attributes.conditionalShow;
	const dataAttributes: Record<string, string | boolean | number> = {
		'data-multiple': props.attributes.multiple,
		'data-accept-types': props.attributes.acceptTypes,
		'data-max-file-size': props.attributes.maxFileSize,
		'data-max-files': props.attributes.maxFiles,
	};

	return (
		<div
			{...useBlockProps.save({
				className,
				...(hasConditionalShowToOutput(conditionalShow) && { 'data-conditional-show': JSON.stringify(conditionalShow) }),
			})}
		>
			<label htmlFor={props.attributes.id}>{props.attributes.label}</label>
			<div 
				className="streamery-forms-file-upload-field" 
				data-field-name={props.attributes.name}
				data-field-id={props.attributes.id}
				{...dataAttributes}
			>
				{/*
					The drop zone is decorative: dragging is a mouse-only nicety.
					The real <input type="file"> below stays in the tab order and
					is only *visually* hidden, so keyboard and screen reader users
					reach the native file picker. It used to be
					opacity:0/width:0/pointer-events:none, which removed it from
					the accessibility tree entirely -- there was no way to upload
					a file without a mouse.
				*/}
				<div className="streamery-forms-file-upload-zone">
					<div className="streamery-forms-file-upload-icon" aria-hidden="true">
						<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
							<polyline points="17 8 12 3 7 8" />
							<line x1="12" y1="3" x2="12" y2="15" />
						</svg>
					</div>
					<p className="streamery-forms-file-upload-text">
						<span className="streamery-forms-file-upload-text-primary">Select a file to upload</span>
						<span className="streamery-forms-file-upload-text-secondary">or drag and drop it here</span>
					</p>
					<input
						type="file"
						name={props.attributes.name}
						id={props.attributes.id}
						className="streamery-forms-file-input"
						multiple={props.attributes.multiple}
						accept={props.attributes.acceptTypes}
						required={props.attributes.required}
						aria-describedby={props.attributes.help ? `${props.attributes.id}-help` : undefined}
					/>
				</div>
				<div className="streamery-forms-file-upload-list"></div>
			</div>
			{props.attributes.help && <p className="streamery-forms-field__help" id={`${props.attributes.id}-help`}>{props.attributes.help}</p>}
		</div>
	);
}

