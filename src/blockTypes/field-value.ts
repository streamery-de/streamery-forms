export type FieldValueAttributes = {
	/** Name of the form field whose value is shown. */
	sourceFieldName: string;
	/** 0 = paragraph, 1-6 = heading level. */
	level: number;
	textAlign?: string;
	/** Text before the value, only shown together with it. */
	prefix: string;
	/** Text after the value, only shown together with it. */
	suffix: string;
	/** Shown while the field is empty. Empty fallback hides the whole block. */
	fallback: string;
	/** Select/radio/checkbox: show the option label instead of its value. */
	showOptionLabels: boolean;
	/** Bold value, independent of prefix and suffix. */
	valueBold?: boolean;
};
