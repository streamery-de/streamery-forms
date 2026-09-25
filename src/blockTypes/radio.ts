import { type GlobalFieldAttributes } from './globalField';

export type RadioAttributes = GlobalFieldAttributes & {
	options: Array<{
		label: string;
		value: string;
		description?: string;
		imageId?: number;
		imageUrl?: string;
		imageAlt?: string;
	}>;
	styleVariant: 'default' | 'toggle' | 'badges' | 'cards';
	layout: 'horizontal' | 'vertical';
	/** Append an option whose value the visitor types in. */
	allowCustomOption?: boolean;
	/** Placeholder of the custom option's text field. */
	customOptionLabel?: string;
};
