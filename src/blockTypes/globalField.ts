import type { ConditionalShow } from './conditionalLogic';

type GlobalFieldAttributes = {
	label: string;
	name: string;
	id: string;
	placeholder: string;
	help: string;
	required: boolean;
	/** Initial value; for option fields the value of the preselected option ('' = none). */
	defaultValue?: string;
	/** Visually hide the label (it stays available to screen readers). */
	hideLabel?: boolean;
	useCustomName: boolean | undefined;
	useCustomId: boolean | undefined;
	/** When set, this field is only shown when the condition is met. */
	conditionalShow?: ConditionalShow;
};

type GlobalFieldControlsProps = {	
	attributes: GlobalFieldAttributes;
	setAttributes: (attributes: Partial<GlobalFieldAttributes>) => void;
};

export type { GlobalFieldAttributes, GlobalFieldControlsProps };