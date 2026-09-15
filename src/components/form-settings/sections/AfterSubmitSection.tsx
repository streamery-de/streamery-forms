/**
 * After Submit section: redirect and error copy. The success screen itself
 * is edited on the canvas via the toolbar toggle, not as a text field here.
 */
import { TextControl, TextareaControl, Notice } from '@wordpress/components';
import { __ } from '@/lib/i18n';
import { type FormAttributes } from '@/blockTypes/form';

type Props = {
	attributes: FormAttributes;
	setAttributes: (next: Partial<FormAttributes>) => void;
};

export function AfterSubmitSection({ attributes, setAttributes }: Props) {
	const redirectUrl = attributes.redirectUrl || '';

	return (
		<>
			<h3 className="streamery-forms-form-settings__section-title">
				{__('formSettingsAfterSubmit')}
			</h3>
			<p className="streamery-forms-form-settings__section-description">
				{__('formSettingsAfterSubmitDescription')}
			</p>

			<div className="streamery-forms-form-settings__field">
				<TextareaControl
					label={__('errorMessage')}
					value={attributes.errorMessage || ''}
					onChange={(errorMessage) => setAttributes({ errorMessage })}
					placeholder={__('errorMessageDefault')}
					rows={2}
					__nextHasNoMarginBottom={true}
				/>
			</div>

			<div className="streamery-forms-form-settings__field">
				<TextControl
					label={__('redirectUrl')}
					value={redirectUrl}
					onChange={(value) => setAttributes({ redirectUrl: value })}
					placeholder="https://example.com/thank-you"
					help={__('redirectUrlHelp')}
					__next40pxDefaultSize={true}
					__nextHasNoMarginBottom={true}
				/>
			</div>

			{redirectUrl !== '' && !/^https?:\/\//i.test(redirectUrl) && !redirectUrl.startsWith('/') && (
				<Notice status="warning" isDismissible={false}>
					{__('redirectUrlInvalid')}
				</Notice>
			)}
		</>
	);
}
