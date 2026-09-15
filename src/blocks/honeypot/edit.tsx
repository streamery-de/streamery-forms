import { __ } from '@/lib/i18n';
import { type BlockEditProps } from '@wordpress/blocks';
import { type HoneypotAttributes } from '@/blockTypes/honeypot';
import './editor.css';
import { useUniqueID } from '../../lib/use-unique-id';
import { useNameFromLabel } from '../../lib/use-name-from-label';
import { PanelBody, TextControl } from '@wordpress/components';
import { InspectorControls } from '@wordpress/block-editor';

export default function Edit(props: BlockEditProps<HoneypotAttributes>) {
	const { attributes, setAttributes, clientId } = props;

	// Automatically generate and set unique ID
	useUniqueID(attributes.id, clientId, setAttributes);

	// Automatically generate name from fieldName
	useNameFromLabel(
		attributes.fieldName,
		attributes.name,
		(name) => setAttributes({ name }),
		attributes.useCustomName || false
	);

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('honeypotSettings', 'HoneyPot Settings')}>
					<TextControl
						label={__('fieldName', 'Field Name')}
						value={attributes.fieldName}
						onChange={(value) => setAttributes({ fieldName: value })}
						help={__('honeypotFieldNameHelp', "Bait name shown in the markup. Bots often fill fields called 'website' or 'url'.")}
					/>
				</PanelBody>
			</InspectorControls>
			<div className="streamery-forms-honeypot-placeholder" style={{ padding: '12px', background: '#f5f5f5', border: '1px dashed #ccc', borderRadius: '4px', fontSize: '12px', color: '#666' }}>
				{__('honeypotEditorTitle', '🕵️ HoneyPot Field (Hidden)')}
				<p style={{ margin: '4px 0 0 0', fontSize: '11px' }}>
					{__('honeypotEditorPlaceholder', 'Completely hidden on the frontend. If it is filled in, the submission is rejected server-side as spam.')}
				</p>
			</div>
		</>
	);
}

