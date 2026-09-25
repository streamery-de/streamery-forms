/**
 * Frontend script for radio block.
 * Radio value is submitted via FormData.
 */
import { initCustomOptions } from '../../lib/custom-option';

window.addEventListener('DOMContentLoaded', () => {
	initCustomOptions('.streamery-forms-field--radio', 'streamery-forms-radio-option');
});
