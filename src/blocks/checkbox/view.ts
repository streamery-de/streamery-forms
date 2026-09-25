/**
 * Frontend script for checkbox block.
 * Checkbox values are submitted via FormData; optional validation (e.g. at-least-one) can be added here.
 */
import { initCustomOptions } from '../../lib/custom-option';

window.addEventListener('DOMContentLoaded', () => {
	initCustomOptions('.streamery-forms-field--checkbox', 'streamery-forms-checkbox-option');
});
