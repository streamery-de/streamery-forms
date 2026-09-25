/**
 * Until 1.0.9, typing a placeholder copied it into defaultValue on the first
 * keystroke, so many fields carry the placeholder's first letter (or, when it
 * was pasted, the whole placeholder) as their default - also after the
 * placeholder was changed or cleared again. save() wrote defaults in a form
 * browsers ignore, so they never showed. Now that defaults reach the
 * frontend, blocks migrated from the old save drop such leftovers instead of
 * suddenly prefilling "M" into every field.
 */
type WithDefault = { defaultValue?: string; placeholder?: string };

const isPlaceholderPrefix = ({ defaultValue, placeholder }: WithDefault) =>
	!!defaultValue && !!placeholder && placeholder.startsWith(defaultValue);

/** Text fields: a one-character default is the first keystroke of a placeholder. */
export function dropPlaceholderCopy<T extends WithDefault>(attributes: T): T {
	const { defaultValue } = attributes;
	if (isPlaceholderPrefix(attributes) || defaultValue?.length === 1) {
		return { ...attributes, defaultValue: '' };
	}
	return attributes;
}

/**
 * Option fields: option values like "1" are legitimate one-character
 * defaults, so only a default that matches the placeholder is dropped.
 */
export function dropOptionPlaceholderCopy<T extends WithDefault>(attributes: T): T {
	return isPlaceholderPrefix(attributes) ? { ...attributes, defaultValue: '' } : attributes;
}
