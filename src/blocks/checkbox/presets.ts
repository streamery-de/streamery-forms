import { __ } from '@/lib/i18n';
import { ListChecks, Mail, ShieldCheck } from 'lucide-react';
import { type FieldVariationPreset } from '@/lib/field-variations';
import { type CheckboxAttributes } from '@/blockTypes/checkbox';

export type CheckboxPreset = FieldVariationPreset<CheckboxAttributes>;

export const getCheckboxPresets = (): CheckboxPreset[] => [
	{
		// Plain multi-option group -- the variation for images and a custom option.
		name: 'group',
		title: __('checkboxGroup', 'Checkboxes'),
		description: __('checkboxVariationGroupDescription', 'A group of options where visitors can pick several.'),
		icon: ListChecks,
		attributes: {
			presetName: 'group',
			label: __('checkboxGroup', 'Checkboxes'),
			options: [
				{ label: __('optionNumber', 'Option %d').replace('%d', '1'), value: 'option-1' },
				{ label: __('optionNumber', 'Option %d').replace('%d', '2'), value: 'option-2' },
			],
			required: false,
			isConsent: false,
			styleVariant: 'default',
			layout: 'vertical',
		},
		isDefault: true,
		isActive: (attributes) =>
			!attributes.isConsent && attributes.presetName !== 'consent' && attributes.presetName !== 'newsletter',
	},
	{
		name: 'consent',
		title: __('consent'),
		description: __('checkboxVariationConsentDescription'),
		icon: ShieldCheck,
		attributes: {
			presetName: 'consent',
			label: __('iAgreeToPrivacyPolicy'),
			options: [{ label: __('iAgreeToPrivacyPolicy'), value: 'agreed' }],
			required: true,
			isConsent: true,
			styleVariant: 'default',
			layout: 'vertical',
		},
		isActive: (attributes) => attributes.presetName === 'consent' || attributes.isConsent === true,
	},
	{
		name: 'newsletter',
		title: __('newsletter'),
		description: __('checkboxVariationNewsletterDescription'),
		icon: Mail,
		attributes: {
			presetName: 'newsletter',
			label: __('subscribeToNewsletter'),
			options: [{ label: __('subscribeToNewsletter'), value: 'subscribed' }],
			required: false,
			isConsent: false,
			styleVariant: 'default',
			layout: 'vertical',
		},
		isActive: (attributes) => attributes.presetName === 'newsletter',
	},
];

export const getCheckboxOptionPresets = (): Array<{
	name: string;
	title: string;
	options: CheckboxPreset['attributes']['options'];
}> =>
	getCheckboxPresets()
		.filter((preset) => !preset.attributes.isConsent && preset.name !== 'group')
		.map(({ name, title, attributes }) => ({
			name,
			title,
			options: attributes.options ?? [],
		}));
