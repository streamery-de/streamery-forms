/**
 * Internationalization utility for accessing translated strings.
 * 
 * Strings are translated in PHP and passed via window.streameryForms.strings
 * or window.streamery_forms.strings (for block editor).
 */

declare global {
	interface Window {
		streameryForms?: {
			strings?: Record<string, string>;
		};
		streamery_forms?: {
			strings?: Record<string, string>;
		};
	}
}

/**
 * Get a translated string by key.
 * 
 * @param key The string key
 * @param fallback Optional fallback string if key is not found
 * @returns The translated string or fallback
 */
export function __(key: string, fallback?: string): string {
	// Normalize key to lowercase for case-insensitive lookup
	const normalizedKey = key.toLowerCase();
	
	// Try admin context first (window.streameryForms)
	const adminStrings = window.streameryForms?.strings;
	if (adminStrings) {
		// Try exact match first
		if (adminStrings[key]) {
			return adminStrings[key];
		}
		// Try normalized (lowercase) key
		if (adminStrings[normalizedKey]) {
			return adminStrings[normalizedKey];
		}
		// Try to find by matching values (for backward compatibility)
		for (const [k, v] of Object.entries(adminStrings)) {
			if (v === key) {
				return v;
			}
		}
	}

	// Try block editor context (window.streamery_forms)
	const editorStrings = window.streamery_forms?.strings;
	if (editorStrings) {
		// Try exact match first
		if (editorStrings[key]) {
			return editorStrings[key];
		}
		// Try normalized (lowercase) key
		if (editorStrings[normalizedKey]) {
			return editorStrings[normalizedKey];
		}
		// Try to find by matching values (for backward compatibility)
		for (const [k, v] of Object.entries(editorStrings)) {
			if (v === key) {
				return v;
			}
		}
	}

	// Return fallback or key if not found
	return fallback || key;
}

/**
 * Get a translated string by key (alias for __).
 * 
 * @param key The string key
 * @param fallback Optional fallback string if key is not found
 * @returns The translated string or fallback
 */
export function translate(key: string, fallback?: string): string {
	return __(key, fallback);
}

