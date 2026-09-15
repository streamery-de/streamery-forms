/**
 * Storage & Inbox section.
 *
 * These are the per-form settings of the mandatory database feed: which
 * mailbox its entries land in, and the subject they're filed under.
 */
import { TextControl } from '@wordpress/components';
import { __ } from '@/lib/i18n';
import { MailboxSelect } from '@/controls';
import { type FormAttributes, type ProviderOverride } from '@/blockTypes/form';
import { useProviders } from '@/hooks/useProviders';

type Props = {
	attributes: FormAttributes;
	setAttributes: (next: Partial<FormAttributes>) => void;
	setProviderOverride: (providerId: number, override: ProviderOverride) => void;
};

export function StorageSection({ attributes, setAttributes, setProviderOverride }: Props) {
	const { providers } = useProviders({ is_active: true });

	// The mandatory database feed. Its per-form subject is stored as a settings
	// override on that feed, which the server validates against the provider's
	// allow_form_override flags.
	const databaseFeed = providers.find((p) => p.provider_type === 'database');
	const overrides = attributes.providerOverrides || {};
	const feedOverride: ProviderOverride | undefined = databaseFeed
		? overrides[String(databaseFeed.id)]
		: undefined;

	const subject = (feedOverride?.settings?.subject as string) ?? '';

	return (
		<>
			<h3 className="streamery-forms-form-settings__section-title">
				{__('formSettingsStorage', 'Storage & Inbox')}
			</h3>
			<p className="streamery-forms-form-settings__section-description">
				{__(
					'formSettingsStorageDescription',
					'Every submission of this form is stored in the inbox. Choose where it lands.'
				)}
			</p>

			<div className="streamery-forms-form-settings__field">
				<MailboxSelect
					value={attributes.mailboxId}
					onChange={(mailboxId) => setAttributes({ mailboxId })}
				/>
			</div>

			{databaseFeed && (
				<div className="streamery-forms-form-settings__field">
					<TextControl
						label={__('entrySubject', 'Entry subject')}
						value={subject}
						onChange={(value) =>
							setProviderOverride(databaseFeed.id, {
								useProviderLayout: feedOverride?.useProviderLayout ?? true,
								content: feedOverride?.content ?? '',
								conditionalShow: feedOverride?.conditionalShow ?? null,
								settings: { ...(feedOverride?.settings || {}), subject: value },
							})
						}
						help={__(
							'entrySubjectHelp',
							'Shown as the entry title in the inbox. Placeholders like {form_title} are replaced.'
						)}
						__next40pxDefaultSize={true}
						__nextHasNoMarginBottom={true}
					/>
				</div>
			)}
		</>
	);
}
