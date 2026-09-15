/**
 * Spam Protection section.
 *
 * Only the per-form toggles live here. The CAPTCHA site key and secret are
 * site-wide plugin settings, never block attributes -- the secret used to be
 * written into the public page markup as a data attribute.
 */
import { ToggleControl, SelectControl, Notice } from '@wordpress/components';
import { __ } from '@/lib/i18n';
import { type FormSettings } from '@/blockTypes/form';

type Props = {
	formSettings: FormSettings;
	setFormSettings: <K extends keyof FormSettings>(
		group: K,
		value: Partial<NonNullable<FormSettings[K]>>
	) => void;
};

export function SpamSection({ formSettings, setFormSettings }: Props) {
	const spam = formSettings.spamProtection || {};
	// Both default to on, matching the server-side default in FormRegistry.
	const honeypot = spam.honeypot !== false;
	const captcha = spam.captcha !== false;

	const captchaConfig = (window as any).streamery_forms?.captcha || {};
	const anyCaptchaConfigured =
		!!captchaConfig?.recaptcha?.enabled || !!captchaConfig?.friendlycaptcha?.enabled;

	return (
		<>
			<h3 className="streamery-forms-form-settings__section-title">
				{__('formSettingsSpam', 'Spam Protection')}
			</h3>
			<p className="streamery-forms-form-settings__section-description">
				{__(
					'formSettingsSpamDescription',
					'Rate limiting and submit-timing checks always run and are not configurable per form.'
				)}
			</p>

			<div className="streamery-forms-form-settings__field">
				<ToggleControl
					label={__('honeypotEnabled', 'Honeypot field')}
					help={__(
						'honeypotEnabledHelp',
						'Adds a hidden field that bots fill in and humans never see. Requires a HoneyPot block in the form.'
					)}
					checked={honeypot}
					onChange={(value) => setFormSettings('spamProtection', { honeypot: value })}
					__nextHasNoMarginBottom={true}
				/>
			</div>

			<div className="streamery-forms-form-settings__field">
				<ToggleControl
					label={__('captchaEnabled', 'CAPTCHA verification')}
					help={__(
						'captchaEnabledHelp',
						'Verified server-side on every submission. Requires a CAPTCHA block in the form.'
					)}
					checked={captcha}
					onChange={(value) => setFormSettings('spamProtection', { captcha: value })}
					__nextHasNoMarginBottom={true}
				/>
			</div>

			{captcha && (
				<div className="streamery-forms-form-settings__field">
					<SelectControl
						label={__('captchaType', 'CAPTCHA type')}
						value={spam.captchaType || 'friendlycaptcha'}
						options={[
							{ label: 'FriendlyCaptcha', value: 'friendlycaptcha' },
							{ label: 'Google reCAPTCHA', value: 'recaptcha' },
						]}
						onChange={(value) =>
							setFormSettings('spamProtection', {
								captchaType: value as 'friendlycaptcha' | 'recaptcha',
							})
						}
						__next40pxDefaultSize={true}
						__nextHasNoMarginBottom={true}
					/>
				</div>
			)}

			{captcha && !anyCaptchaConfigured && (
				<Notice status="warning" isDismissible={false}>
					{__(
						'captchaNotConfigured',
						'No CAPTCHA keys are configured yet. Add them under Streamery Forms → Settings; until then, CAPTCHA verification is skipped.'
					)}
				</Notice>
			)}
		</>
	);
}
