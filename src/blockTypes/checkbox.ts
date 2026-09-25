import { type GlobalFieldAttributes } from './globalField';

export type CheckboxAttributes = GlobalFieldAttributes & {
	options: Array<{
		label: string;
		value: string;
		description?: string;
		imageId?: number;
		imageUrl?: string;
		imageAlt?: string;
	}>;
	styleVariant: 'default' | 'toggle' | 'cards' | 'badges';
	layout: 'horizontal' | 'vertical';
	/** Every style but cards: option image before or after the text. */
	inlineImagePosition?: 'before' | 'after';
	/** Cards style: option image top left, or centered without the check indicator. */
	imagePosition?: 'top-left' | 'center';
	/** Append an option whose value the visitor types in. */
	allowCustomOption?: boolean;
	/** Placeholder of the custom option's text field. */
	customOptionLabel?: string;
	/** Single consent checkbox (e.g. privacy policy); uses single name, not name[]. */
	isConsent?: boolean;
	/** Preset variation slug (consent, newsletter, etc.). */
	presetName?: string;
};
