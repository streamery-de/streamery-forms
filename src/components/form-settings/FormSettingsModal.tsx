/**
 * Form Settings Modal
 *
 * A standalone dialog for everything that used to be stacked into the form
 * block's inspector sidebar. It is deliberately independent of the block that
 * opened it: it receives only the *form* block's clientId, reads that block's
 * attributes itself, and writes back to it via updateBlockAttributes.
 *
 * That indirection is what makes the toolbar button work from a nested inner
 * block -- calling the inner block's own setAttributes there would write the
 * form's settings onto the input/step/group the user happens to have selected.
 */
import { useState } from '@wordpress/element';
import { Modal } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@/lib/i18n';
import { type FormAttributes, type FormSettings, type ProviderOverride } from '@/blockTypes/form';
import { Lock } from 'lucide-react';
import './form-settings.css';

import { StorageSection } from './sections/StorageSection';
import { ProvidersSection } from './sections/ProvidersSection';
import { SpamSection } from './sections/SpamSection';
import { AfterSubmitSection } from './sections/AfterSubmitSection';
import { PrivacySection } from './sections/PrivacySection';

export type SectionId = 'storage' | 'providers' | 'spam' | 'after-submit' | 'privacy';

const SECTIONS: Array<{ id: SectionId; label: string }> = [
	{ id: 'storage', label: __('formSettingsStorage') },
	{ id: 'providers', label: __('formSettingsProviders') },
	{ id: 'spam', label: __('formSettingsSpam') },
	{ id: 'after-submit', label: __('formSettingsAfterSubmit') },
	{ id: 'privacy', label: __('formSettingsPrivacy') },
];

export type FormSettingsModalProps = {
	/** clientId of the streamery-forms/form block being edited (never an inner block). */
	formClientId: string;
	onClose: () => void;
};

export function FormSettingsModal({ formClientId, onClose }: FormSettingsModalProps) {
	const [activeSection, setActiveSection] = useState<SectionId>('storage');

	const attributes = useSelect(
		(select: any) => select('core/block-editor').getBlockAttributes(formClientId) as FormAttributes | null,
		[formClientId]
	);

	const { updateBlockAttributes } = useDispatch('core/block-editor');

	if (!attributes) {
		return null;
	}

	const setAttributes = (next: Partial<FormAttributes>) => {
		updateBlockAttributes(formClientId, next);
	};

	const formSettings: FormSettings = attributes.formSettings || {};

	/** Merges a partial update into one group of the formSettings object. */
	const setFormSettings = <K extends keyof FormSettings>(group: K, value: Partial<NonNullable<FormSettings[K]>>) => {
		setAttributes({
			formSettings: {
				...formSettings,
				[group]: {
					...(formSettings[group] || {}),
					...value,
				},
			},
		});
	};

	const setProviderOverride = (providerId: number, override: ProviderOverride) => {
		setAttributes({
			providerOverrides: {
				...(attributes.providerOverrides || {}),
				[String(providerId)]: override,
			},
		});
	};

	return (
		<Modal
			title={__('formSettings')}
			onRequestClose={onClose}
			className="streamery-forms-form-settings-modal"
			size="large"
		>
			<div className="streamery-forms-ui">
				<div className="streamery-forms-form-settings__layout">
					<nav className="streamery-forms-form-settings__nav" aria-label={__('formSettings')}>
						{SECTIONS.map((section) => (
							<button
								key={section.id}
								type="button"
								className="streamery-forms-form-settings__nav-item"
								aria-current={activeSection === section.id}
								onClick={() => setActiveSection(section.id)}
							>
								{section.label}
							</button>
						))}
					</nav>

					<div className="streamery-forms-form-settings__panel">
						{activeSection === 'storage' && (
							<StorageSection
								attributes={attributes}
								setAttributes={setAttributes}
								setProviderOverride={setProviderOverride}
							/>
						)}
						{activeSection === 'providers' && (
							<ProvidersSection
								formClientId={formClientId}
								attributes={attributes}
								setAttributes={setAttributes}
								setProviderOverride={setProviderOverride}
							/>
						)}
						{activeSection === 'spam' && (
							<SpamSection
								formSettings={formSettings}
								setFormSettings={setFormSettings}
							/>
						)}
						{activeSection === 'after-submit' && (
							<AfterSubmitSection attributes={attributes} setAttributes={setAttributes} />
						)}
						{activeSection === 'privacy' && (
							<PrivacySection
								formSettings={formSettings}
								setFormSettings={setFormSettings}
							/>
						)}
					</div>
				</div>
			</div>
		</Modal>
	);
}

/** Shared lock indicator for provider entries a form may not switch off. */
export function LockedIndicator() {
	return (
		<span className="streamery-forms-form-settings__lock">
			<Lock size={13} aria-hidden="true" />
			{__('alwaysOn', 'Always on')}
		</span>
	);
}
