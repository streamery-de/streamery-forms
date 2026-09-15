/**
 * Privacy section: IP storage opt-out and an automatic retention period.
 *
 * Both are enforced server-side -- see Providers\Database (IP) and
 * Core\Retention (the daily purge job).
 */
import { ToggleControl, TextControl, Notice } from '@wordpress/components';
import { __ } from '@/lib/i18n';
import { type FormSettings } from '@/blockTypes/form';

type Props = {
	formSettings: FormSettings;
	setFormSettings: <K extends keyof FormSettings>(
		group: K,
		value: Partial<NonNullable<FormSettings[K]>>
	) => void;
};

export function PrivacySection({ formSettings, setFormSettings }: Props) {
	const privacy = formSettings.privacy || {};
	const storeIp = privacy.storeIp !== false;
	const retentionDays = privacy.retentionDays ?? 0;

	return (
		<>
			<h3 className="streamery-forms-form-settings__section-title">
				{__('formSettingsPrivacy', 'Privacy')}
			</h3>
			<p className="streamery-forms-form-settings__section-description">
				{__(
					'formSettingsPrivacyDescription',
					'Controls what is kept about each submission, and for how long.'
				)}
			</p>

			<div className="streamery-forms-form-settings__field">
				<ToggleControl
					label={__('storeIpAddress', "Store the submitter's IP address")}
					help={__(
						'storeIpAddressHelp',
						'Stored alongside the entry for spam analysis. Turn off if your privacy policy does not cover it.'
					)}
					checked={storeIp}
					onChange={(value) => setFormSettings('privacy', { storeIp: value })}
					__nextHasNoMarginBottom={true}
				/>
			</div>

			<div className="streamery-forms-form-settings__field">
				<TextControl
					label={__('retentionDays', 'Delete entries after (days)')}
					type="number"
					min={0}
					value={String(retentionDays)}
					onChange={(value) => {
						const parsed = parseInt(value, 10);
						setFormSettings('privacy', { retentionDays: isNaN(parsed) || parsed < 0 ? 0 : parsed });
					}}
					help={__(
						'retentionDaysHelp',
						'0 keeps entries forever. Otherwise a daily job permanently deletes entries of this form once they are older than this.'
					)}
					__next40pxDefaultSize={true}
					__nextHasNoMarginBottom={true}
				/>
			</div>

			{retentionDays > 0 && (
				<Notice status="warning" isDismissible={false}>
					{__(
						'retentionWarning',
						'Deletion is permanent and cannot be undone. Make sure anything you need is exported or forwarded to another provider.'
					)}
				</Notice>
			)}
		</>
	);
}
