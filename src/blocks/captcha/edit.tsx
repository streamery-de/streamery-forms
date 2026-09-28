import { __ } from '@/lib/i18n';
import { type BlockEditProps } from '@wordpress/blocks';
import { type CaptchaAttributes } from '@/blockTypes/captcha';
import './editor.css';
import { useUniqueID } from '../../lib/use-unique-id';
import { useNameFromLabel } from '../../lib/use-name-from-label';
import { FieldWrapper } from '../../components/block-atoms/FieldWrapper';
import { Notice, PanelBody } from '@wordpress/components';
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

	// The provider is a site-wide setting (Settings → CAPTCHA). The block's
	// captchaType attribute is kept for existing content, but the frontend
	// always renders the active provider.
	const captchaConfig = (window as any).streamery_forms?.captcha || {};
	const activeProvider = captchaConfig?.recaptcha?.enabled
		? 'Google reCAPTCHA v3'
		: captchaConfig?.friendlycaptcha?.enabled
			? 'Friendly Captcha'
			: '';

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('captchaSettings', 'CAPTCHA Settings')}>
					{activeProvider ? (
						<p>{__('captchaActiveProvider', 'Active provider:')} <strong>{activeProvider}</strong></p>
					) : (
						<Notice status="warning" isDismissible={false}>
							{__('captchaNoProvider', 'No CAPTCHA provider is active. Set one up under Streamery Forms → Settings → CAPTCHA.')}
						</Notice>
					)}
					<p className="components-base-control__help">
						{__('captchaKeysHint', 'Site key and secret are configured once under Streamery Forms → Settings → CAPTCHA, not per block.')}
					</p>
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
					{activeProvider ? `🛡️ ${activeProvider}` : `⚠️ ${__('captchaNoProviderShort', 'No CAPTCHA provider active')}`}
					<p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
						{__('captchaEditorPlaceholder', 'CAPTCHA will be displayed here on the frontend')}
					</p>
				</div>
			</FieldWrapper>
		</>
	);
}
