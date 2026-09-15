import { __ } from '@/lib/i18n';
import { type BlockEditProps } from '@wordpress/blocks';
import { type CaptchaAttributes } from '@/blockTypes/captcha';
import './editor.css';
import { useUniqueID } from '../../lib/use-unique-id';
import { useNameFromLabel } from '../../lib/use-name-from-label';
import { FieldWrapper } from '../../components/block-atoms/FieldWrapper';
import { PanelBody, SelectControl } from '@wordpress/components';
import { InspectorControls } from '@wordpress/block-editor';

export default function Edit(props: BlockEditProps<CaptchaAttributes>) {
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
			<InspectorControls>
				<PanelBody title={__('captchaSettings', 'CAPTCHA Settings')}>
					<SelectControl
						label={__('captchaType', 'CAPTCHA Type')}
						value={attributes.captchaType}
						options={[
							{ label: 'FriendlyCaptcha', value: 'friendlycaptcha' },
							{ label: 'Google reCAPTCHA', value: 'recaptcha' },
						]}
						onChange={(value) => setAttributes({ captchaType: value as 'friendlycaptcha' | 'recaptcha' })}
						help={__('captchaKeysHint', 'Site key and secret are configured once under Streamery Forms → Settings, not per block.')}
					/>
				</PanelBody>
			</InspectorControls>
			<FieldWrapper
				label={attributes.label || __('captcha', 'CAPTCHA')}
				onLabelChange={(label) => setAttributes({ label })}
				help={attributes.help}
				onHelpChange={(help) => setAttributes({ help })}
				attributes={attributes}
			>
				<div className="streamery-forms-captcha-placeholder" style={{ padding: '20px', border: '2px dashed #ccc', textAlign: 'center' }}>
					{attributes.captchaType === 'friendlycaptcha' ? '🔒 FriendlyCaptcha' : '🛡️ Google reCAPTCHA'}
					<p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
						{__('captchaEditorPlaceholder', 'CAPTCHA will be displayed here on the frontend')}
					</p>
				</div>
			</FieldWrapper>
		</>
	);
}

