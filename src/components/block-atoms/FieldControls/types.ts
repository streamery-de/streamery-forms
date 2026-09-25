type Attributes = {
	name: string;
	id: string;
	placeholder: string;
	required: boolean;
	hideLabel?: boolean;
	useCustomName: boolean | undefined;
	useCustomId: boolean | undefined;
	defaultValue?: string;
};

type FieldControlsProps = {
	attributes: Attributes;
	setAttributes: (attributes: Partial<Attributes>) => void;
};

export type { Attributes, FieldControlsProps };