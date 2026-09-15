/**
 * Providers & Actions section.
 *
 * Required feeds (the database) always appear first as a locked entry.
 * Every other active feed is listed here with an on/off toggle -- no nested
 * modal, since this panel already lives inside Form Settings.
 */
import { useState } from '@wordpress/element';
import { Button, Modal, ToggleControl } from '@wordpress/components';
import { Lock } from 'lucide-react';
import { __ } from '@/lib/i18n';
import { useProviders, useProviderTypes } from '@/hooks/useProviders';
import { useFormFieldList } from '@/hooks/useFormFieldList';
import { type FormAttributes, type ProviderOverride } from '@/blockTypes/form';
import { ProviderConditionalLogicPanel } from '@/blocks/form/ProviderConditionalLogicPanel';
import { FullscreenTemplateEditor } from '@/components/email-template-editor/FullscreenTemplateEditor';
import { FieldMapEditor } from '../FieldMapEditor';

type Props = {
	formClientId: string;
	attributes: FormAttributes;
	setAttributes: (next: Partial<FormAttributes>) => void;
	setProviderOverride: (providerId: number, override: ProviderOverride) => void;
};

export function ProvidersSection({ formClientId, attributes, setAttributes, setProviderOverride }: Props) {
	const [editingProviderId, setEditingProviderId] = useState<number | null>(null);

	const { providers, loading, error } = useProviders({ is_active: true });
	const { types } = useProviderTypes();

	const providerIds = attributes.providerIds || [];
	const overrides = attributes.providerOverrides || {};

	const fieldList = useFormFieldList(formClientId, formClientId);
	const formPlaceholders = fieldList.map((f) => ({
		value: `{${f.name}}`,
		label: f.label || f.name,
		description: undefined,
		category: 'form' as const,
	}));

	const requiredSlugs = types.filter((t) => t.is_required).map((t) => t.slug);
	const requiredFeeds = providers.filter((p) => requiredSlugs.includes(p.provider_type));
	const optionalFeeds = providers.filter((p) => !requiredSlugs.includes(p.provider_type));

	const getOverride = (id: number): ProviderOverride =>
		overrides[String(id)] ?? { useProviderLayout: true, content: '', conditionalShow: null };

	const toggleFeed = (id: number) => {
		if (providerIds.includes(id)) {
			setAttributes({ providerIds: providerIds.filter((pid) => pid !== id) });
		} else {
			setAttributes({ providerIds: [...providerIds, id] });
		}
	};

	const providerMeta = (feed: { provider_type: string; form_identifier?: string | null }) => {
		const typeLabel = types.find((t) => t.slug === feed.provider_type)?.title || feed.provider_type;
		const scope = feed.form_identifier ? feed.form_identifier : __('globalProvider');
		return `${typeLabel} · ${scope}`;
	};

	return (
		<>
			<h3 className="streamery-forms-form-settings__section-title">
				{__('formSettingsProviders')}
			</h3>
			<p className="streamery-forms-form-settings__section-description">
				{__('formSettingsProvidersDescription')}
			</p>

			{loading && (
				<p className="streamery-forms-form-settings__section-description">{__('loadingProviders')}</p>
			)}
			{error && (
				<p className="streamery-forms-form-settings__section-description">
					{__('error')}: {error.message}
				</p>
			)}

			{requiredFeeds.map((feed) => (
				<div
					key={feed.id}
					className="streamery-forms-form-settings__provider-row streamery-forms-form-settings__provider-row--locked"
				>
					<div className="streamery-forms-form-settings__provider-row-header">
						<div className="streamery-forms-form-settings__provider-identity">
							<div className="streamery-forms-form-settings__provider-name">{feed.name}</div>
							<div className="streamery-forms-form-settings__provider-meta">{providerMeta(feed)}</div>
						</div>
						<span className="streamery-forms-form-settings__lock">
							<Lock size={13} aria-hidden="true" />
							{__('alwaysOn')}
						</span>
					</div>
				</div>
			))}

			{optionalFeeds.map((feed) => {
				const enabled = providerIds.includes(feed.id);
				const override = getOverride(feed.id);
				const type = types.find((t) => t.slug === feed.provider_type);
				const supportsFieldMap = !!type?.fields?.some(
					(f) => f.name === 'field_map' && f.allow_form_override
				);

				return (
					<div
						key={feed.id}
						className={
							enabled
								? 'streamery-forms-form-settings__provider-row'
								: 'streamery-forms-form-settings__provider-row streamery-forms-form-settings__provider-row--off'
						}
					>
						<div className="streamery-forms-form-settings__provider-row-header">
							<div className="streamery-forms-form-settings__provider-identity">
								<div className="streamery-forms-form-settings__provider-name">{feed.name}</div>
								<div className="streamery-forms-form-settings__provider-meta">{providerMeta(feed)}</div>
							</div>
							<ToggleControl
								label={__('enableProvider')}
								hideLabelFromVision
								checked={enabled}
								onChange={() => toggleFeed(feed.id)}
								__nextHasNoMarginBottom={true}
							/>
						</div>

						{enabled && (
							<div className="streamery-forms-form-settings__provider-extras">
								<Button variant="secondary" onClick={() => setEditingProviderId(feed.id)}>
									{__('editTemplate')}
								</Button>

								<ProviderConditionalLogicPanel
									formBlockClientId={formClientId}
									conditionalShow={override.conditionalShow ?? undefined}
									onChange={(conditionalShow) =>
										setProviderOverride(feed.id, {
											...override,
											conditionalShow: conditionalShow ?? null,
										})
									}
								/>

								{supportsFieldMap && (
									<FieldMapEditor
										fields={fieldList}
										value={(override.settings?.field_map as Array<{ field: string; key: string }>) || []}
										onChange={(field_map) =>
											setProviderOverride(feed.id, {
												...override,
												settings: { ...(override.settings || {}), field_map },
											})
										}
									/>
								)}
							</div>
						)}
					</div>
				);
			})}

			{!loading && !error && optionalFeeds.length === 0 && (
				<p className="streamery-forms-form-settings__section-description">{__('noOptionalProviders')}</p>
			)}

			<FullscreenTemplateEditor
				open={editingProviderId !== null}
				onOpenChange={(open) => !open && setEditingProviderId(null)}
				initialHtml={editingProviderId !== null ? getOverride(editingProviderId).content : ''}
				customPlaceholders={formPlaceholders}
				showUseProviderLayoutCheckbox={true}
				initialUseProviderLayout={
					editingProviderId !== null ? getOverride(editingProviderId).useProviderLayout : true
				}
				onSaveWithMeta={
					editingProviderId !== null
						? (data) => {
								const override = getOverride(editingProviderId);
								setProviderOverride(editingProviderId, {
									...override,
									content: data.html,
									useProviderLayout: data.useProviderLayout,
								});
								setEditingProviderId(null);
							}
						: undefined
				}
				hideTemplateSelection={true}
				ModalComponent={Modal}
			/>
		</>
	);
}
