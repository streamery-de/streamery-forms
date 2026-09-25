/**
 * Use this file for JavaScript code that you want to run in the front-end 
 * on posts/pages that contain this block.
 *
 * When this file is defined as the value of the `viewScript` property
 * in `block.json` it will be enqueued on the front end of the site.
 *
 * Example:
 *
 * ```js
 * {
 *   "viewScript": "file:./view.js"
 * }
 * ```
 *
 * If you're not making any changes to this file because your project doesn't need any 
 * JavaScript running in the front-end, then you should delete this file and remove 
 * the `viewScript` property from `block.json`. 
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#view-script
 */

import { getRegisteredSkins } from '../../lib/skins';

/**
 * Translatable frontend string, localized from PHP onto window.streamery_forms
 * (see includes/Assets/Frontend.php). The second argument is the English
 * fallback used when no translation is available.
 */
function formString(key: string, fallback: string): string {
	const strings = (window as any).streamery_forms?.strings || {};
	return strings[key] || fallback;
}

window.addEventListener('DOMContentLoaded', () => {
	const form = document.querySelectorAll('.wp-block-streamery-forms-form');
	form.forEach(form => {
        const formDataOptions = form.getAttribute('data-form-options');
        if (!formDataOptions) {
            console.error('Form options not found');
            return;
        };
        const formOptions = JSON.parse(formDataOptions);
        // Server-side spam check: how long between this form rendering and submit.
        const renderedAt = Date.now();

		// Load skin CSS dynamically
		const skinName = form.getAttribute('data-skin') || formOptions.skin || 'default';
		if (skinName) {
			loadSkinCSS(skinName);
		}

		// Multi-step form setup
		const steps = form.querySelectorAll<HTMLElement>('.wp-block-streamery-forms-step');
		const isMultiStep = steps.length > 0;
		let currentStep = 0;

		if (isMultiStep) {
			initMultiStepForm(form as HTMLElement, steps, formOptions, (step: number) => {
				currentStep = step;
			});
		}

		// Conditional logic: evaluate field visibility and select default-from-field
		evaluateFieldConditions(form as HTMLElement);
		applyDefaultValueFromField(form as HTMLElement);
		updateFieldValueOutputs(form as HTMLElement);
		form.addEventListener('input', () => {
			evaluateFieldConditions(form as HTMLElement);
			applyDefaultValueFromField(form as HTMLElement);
			updateFieldValueOutputs(form as HTMLElement);
		});
		form.addEventListener('change', () => {
			evaluateFieldConditions(form as HTMLElement);
			applyDefaultValueFromField(form as HTMLElement);
			updateFieldValueOutputs(form as HTMLElement);
		});

		form.addEventListener('submit', async (e) => {
			e.preventDefault();

			// For multi-step: only allow submit on the last visible step
			if (isMultiStep) {
				const visibleStepIndices = getVisibleStepIndices(form as HTMLElement);
				if (currentStep < visibleStepIndices.length - 1) return;
			}

			// Only the identifier is sent: which provider feeds run, with which
			// settings, is resolved server-side from the form index.
			const formIdentifier = formOptions.formId;

			if (!formIdentifier) {
				console.error('Form identifier not found');
				return;
			}

			setSubmitLoading(form as HTMLElement, true);
			try {
			
			// For multi-step: temporarily show all steps so FormData collects everything
			if (isMultiStep) {
				steps.forEach(step => step.style.display = '');
			}

			const formData = new FormData(form as HTMLFormElement);
			// Build data object: multi-value fields (checkbox groups render as name[])
			// are sent as arrays so the server can check each value against the
			// field's options; everything else is sent as a single value.
			const data: Record<string, unknown> = {};
			const seen = new Set<string>();
			for (const [key] of formData) {
				if (seen.has(key)) continue;
				seen.add(key);
				const values = formData.getAll(key);
				if (key.endsWith('[]') || values.length > 1) {
					data[key] = values;
				} else if (values.length === 1) {
					data[key] = values[0];
				}
			}

			// Restore step visibility (currentStep is visible index)
			if (isMultiStep) {
				const visibleStepIndices = getVisibleStepIndices(form as HTMLElement);
				goToStepByVisibleIndex(form as HTMLElement, steps, visibleStepIndices, currentStep);
			}
			
			// Extract file upload data from hidden inputs
			const fileUploadFields = form.querySelectorAll<HTMLInputElement>('input[type="hidden"][id$="_files"]');
			fileUploadFields.forEach((hiddenInput) => {
				const fieldName = hiddenInput.name;
				try {
					const fileData = JSON.parse(hiddenInput.value || '[]');
					if (Array.isArray(fileData) && fileData.length > 0) {
						// Store file data as array in submission data
						data[fieldName] = fileData;
					}
				} catch (e) {
					console.error('Failed to parse file data for field:', fieldName, e);
				}
			});
			
			// Extract primary mail field name
			const primaryMailField = form.querySelector<HTMLInputElement>('input[type="email"][data-primary-mail="true"]');
			if (primaryMailField && primaryMailField.name) {
				data['_primary_mail_field'] = primaryMailField.name;
			}

			clearFormMessage(form as HTMLElement);
			clearFieldErrors(form as HTMLElement);

			const result = await submitFormWithProviders(data, formIdentifier, renderedAt);

			// Show debug view if debug data is present
			if (result.debug) {
				showDebugView(result.debug);
			}

			if (result.success) {
				form.classList.add('streamery-forms-form--success-view');

				if (form instanceof HTMLFormElement) {
					form.reset();
					// Also clear file upload lists
					const fileLists = form.querySelectorAll('.streamery-forms-file-upload-list');
					fileLists.forEach(list => {
						list.innerHTML = '';
					});
				}
				// Clear saved progress and reset to first step on successful submit
				if (isMultiStep) {
					currentStep = 0;
					const visibleStepIndices = getVisibleStepIndices(form as HTMLElement);
					goToStepByVisibleIndex(form as HTMLElement, steps, visibleStepIndices, 0);
					updateStepNavigationButtons(form as HTMLElement, steps, visibleStepIndices, 0);
					if (formOptions.formId) {
						sessionStorage.removeItem(`streamery_forms_progress_${formOptions.formId}`);
					}
				}

				const redirectUrl = formOptions.redirectUrl || '';
				if (redirectUrl) {
					window.location.assign(redirectUrl);
					return;
				}

				// If the form has a streamery-forms/success block, the success-view class
				// reveals it; otherwise fall back to an inline confirmation.
				if (!form.querySelector('.wp-block-streamery-forms-success')) {
					showFormMessage(
						form as HTMLElement,
						'success',
						formOptions.successMessage
							|| result.message
							|| formString('submitSuccess', 'Thank you! Your submission has been received.')
					);
				}
			} else {
				// Field-level errors from server-side schema validation.
				if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
					showFieldErrors(form as HTMLElement, result.fieldErrors);
					focusFirstInvalidField(form as HTMLElement, steps, isMultiStep, (step: number) => {
						currentStep = step;
					});
				}

				showFormMessage(
					form as HTMLElement,
					'error',
					result.message
						|| formOptions.errorMessage
						|| formString('submitError', 'Your submission could not be sent. Please try again.')
				);
			}
			} finally {
				setSubmitLoading(form as HTMLElement, false);
			}
		});
	});
});

function setSubmitLoading(formEl: HTMLElement, loading: boolean) {
	formEl.classList.toggle('streamery-forms-form--submitting', loading);
	// Announce the pending state instead of only greying the button out.
	formEl.setAttribute('aria-busy', loading ? 'true' : 'false');
	const buttons = formEl.querySelectorAll<HTMLButtonElement>('button[type="submit"], [data-action="submit"]');
	buttons.forEach((btn) => {
		btn.disabled = loading;
	});
}

type ConditionalShowRule = {
	sourceFieldName: string;
	operator: 'equals' | 'notEquals' | 'isEmpty' | 'isNotEmpty' | 'contains';
	value?: string;
};

type ConditionalShowConfig = ConditionalShowRule | { logic: 'and' | 'or'; conditions: ConditionalShowRule[] };

/**
 * Raw value of a field for conditional logic. Reads the *checked* radio and
 * all checked boxes of a group (name or name[]), not just the first control
 * with that name -- which used to be the first radio's value regardless of
 * the selection, and nothing at all for checkbox groups.
 */
function getSourceFieldValue(formEl: HTMLElement, fieldName: string): string {
	return getFieldDisplayValue(formEl, fieldName, { labels: false, formatDates: false });
}

function evaluateSingleCondition(condition: ConditionalShowRule, formEl: HTMLElement): boolean {
	const raw = getSourceFieldValue(formEl, condition.sourceFieldName);
	const compare = (condition.value || '').trim();
	switch (condition.operator) {
		case 'equals':
			return raw === compare;
		case 'notEquals':
			return raw !== compare;
		case 'isEmpty':
			return raw === '';
		case 'isNotEmpty':
			return raw !== '';
		case 'contains':
			return raw.includes(compare);
		default:
			return true;
	}
}

function isConditionGroup(c: ConditionalShowConfig): c is { logic: 'and' | 'or'; conditions: ConditionalShowRule[] } {
	return c !== null && typeof c === 'object' && 'conditions' in c && Array.isArray((c as any).conditions);
}

function evaluateConditionConfig(config: ConditionalShowConfig, formEl: HTMLElement): boolean {
	if (isConditionGroup(config)) {
		const results = config.conditions
			.filter((r) => r.sourceFieldName)
			.map((r) => evaluateSingleCondition(r, formEl));
		if (results.length === 0) return true;
		return config.logic === 'and' ? results.every(Boolean) : results.some(Boolean);
	}
	if (!config?.sourceFieldName) return true;
	return evaluateSingleCondition(config, formEl);
}

function evaluateFieldConditions(formEl: HTMLElement): void {
	formEl.querySelectorAll<HTMLElement>('[data-conditional-show]').forEach((wrapper) => {
		const json = wrapper.getAttribute('data-conditional-show');
		if (!json) return;
		try {
			const config = JSON.parse(json) as ConditionalShowConfig;
			const show = evaluateConditionConfig(config, formEl);
			wrapper.classList.toggle('streamery-forms-field--conditional-hidden', !show);
			wrapper.style.display = show ? '' : 'none';
		} catch (e) {
			console.warn('Invalid data-conditional-show:', json);
		}
	});

	// A hidden field that is still `required` silently blocks submission:
	// the browser refuses to submit a form with an invalid control it cannot
	// focus, and the submit event never fires -- so nothing happens and nothing
	// explains why. Disabling the controls while hidden takes them out of both
	// validation and FormData, which is also what the server expects for a
	// conditional field. Done in a second pass over the final state, because
	// conditions nest (a field inside a hidden group) and a visible inner field
	// must not re-enable controls its hidden container just disabled.
	formEl
		.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
			'[data-conditional-show] input, [data-conditional-show] select, [data-conditional-show] textarea'
		)
		.forEach((control) => {
			control.disabled = control.closest('.streamery-forms-field--conditional-hidden') !== null;
		});
}

/**
 * Current value of a field: all checked boxes of a group, the checked radio,
 * file names -- optionally with option labels instead of values and localized
 * dates (for the field-value block). Disabled controls (hidden by conditional logic) don't count,
 * matching what the form would submit.
 */
function getFieldDisplayValue(
	formEl: HTMLElement,
	fieldName: string,
	{ labels: useLabels, formatDates }: { labels: boolean; formatDates: boolean }
): string {
	const name = CSS.escape(fieldName);
	const controls = formEl.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
		`[name="${name}"], [name="${name}[]"]`
	);
	const values: string[] = [];

	controls.forEach((control) => {
		if (control.disabled) return;

		if (control instanceof HTMLSelectElement) {
			Array.from(control.selectedOptions).forEach((option) => {
				if (option.value !== '') values.push(useLabels ? option.text.trim() : option.value);
			});
			return;
		}

		if (control instanceof HTMLInputElement && (control.type === 'checkbox' || control.type === 'radio')) {
			if (!control.checked || control.value === '') return;
			const label = control.hasAttribute('data-custom-option')
				? null
				: control.closest('label')?.querySelector('[class$="-option-label"]');
			values.push(useLabels && label?.textContent ? label.textContent.trim() : control.value);
			return;
		}

		if (control instanceof HTMLInputElement && control.type === 'file') {
			Array.from(control.files || []).forEach((file) => values.push(file.name));
			return;
		}

		const raw = (control.value || '').trim();
		if (raw === '') return;

		if (formatDates && control instanceof HTMLInputElement && (control.type === 'date' || control.type === 'datetime-local')) {
			const date = new Date(control.type === 'date' ? `${raw}T00:00` : raw);
			if (!Number.isNaN(date.getTime())) {
				const locale = document.documentElement.lang || undefined;
				values.push(control.type === 'date' ? date.toLocaleDateString(locale) : date.toLocaleString(locale));
				return;
			}
		}

		values.push(raw);
	});

	return values.join(', ');
}

/**
 * Fills every field-value block in the form with the current value of its
 * source field. Deliberately not bound to the form's reset event, so the
 * values survive a successful submit and can be shown on the success screen.
 */
function updateFieldValueOutputs(formEl: HTMLElement): void {
	formEl.querySelectorAll<HTMLElement>('[data-field-value]').forEach((block) => {
		const fieldName = block.getAttribute('data-field-value');
		const output = block.querySelector<HTMLElement>('.streamery-forms-field-value__value');
		if (!fieldName || !output) return;

		const value = getFieldDisplayValue(formEl, fieldName, {
			labels: block.getAttribute('data-field-value-labels') !== 'false',
			formatDates: true,
		});
		const fallback = output.getAttribute('data-fallback') || '';

		// textContent, never innerHTML: this is visitor input.
		output.textContent = value || fallback;
		block.classList.toggle('is-fallback', value === '');
		block.classList.toggle('is-empty', value === '' && fallback === '');
	});
}

function applyDefaultValueFromField(formEl: HTMLElement): void {
	formEl.querySelectorAll<HTMLElement>('[data-default-value-from-field]').forEach((wrapper) => {
		const sourceFieldName = wrapper.getAttribute('data-default-value-from-field');
		if (!sourceFieldName) return;
		const selectEl = wrapper.querySelector<HTMLSelectElement>('select');
		if (!selectEl) return;
		const value = getSourceFieldValue(formEl, sourceFieldName);
		if (selectEl.value !== value) {
			selectEl.value = value;
			selectEl.dispatchEvent(new Event('change', { bubbles: true }));
		}
	});
}

/**
 * Evaluate step conditions and return indices of steps that are visible.
 * Steps without data-conditional-show are always visible.
 */
function getVisibleStepIndices(formEl: HTMLElement): number[] {
	const steps = formEl.querySelectorAll<HTMLElement>('.wp-block-streamery-forms-step');
	const visible: number[] = [];
	steps.forEach((step, index) => {
		const json = step.getAttribute('data-conditional-show');
		if (!json) {
			visible.push(index);
			step.classList.remove('streamery-forms-step--conditional-hidden');
			step.style.display = '';
			return;
		}
		try {
			const config = JSON.parse(json) as ConditionalShowConfig;
			const show = evaluateConditionConfig(config, formEl);
			step.classList.toggle('streamery-forms-step--conditional-hidden', !show);
			step.style.display = show ? '' : 'none';
			if (show) visible.push(index);
		} catch (e) {
			visible.push(index);
			step.classList.remove('streamery-forms-step--conditional-hidden');
			step.style.display = '';
		}
	});
	return visible;
}

/**
 * Show the step at visibleIndex (index into visibleStepIndices) and hide others.
 */
/**
 * Moves focus into a freshly shown step and announces which step it is.
 *
 * Without this, changing step leaves focus on the (now hidden) Next button, so
 * a screen reader user is told nothing changed and a keyboard user is dropped
 * back at the top of the document.
 */
function focusStep(formEl: HTMLElement, stepEl: HTMLElement, visibleIndex: number, total: number) {
	if (!stepEl) return;

	// The step container is not natively focusable. Focusing does not scroll
	// reliably on its own: a tall step whose lower part is already on screen
	// counts as "visible", so the user stayed at the bottom by the nav buttons.
	stepEl.setAttribute('tabindex', '-1');
	stepEl.focus({ preventScroll: true });
	scrollFormIntoView(formEl);

	let liveRegion = formEl.querySelector<HTMLElement>('.streamery-forms-step-status');
	if (!liveRegion) {
		liveRegion = document.createElement('p');
		liveRegion.className = 'streamery-forms-step-status streamery-forms-visually-hidden';
		liveRegion.setAttribute('role', 'status');
		liveRegion.setAttribute('aria-live', 'polite');
		formEl.insertBefore(liveRegion, formEl.firstChild);
	}

	const title = stepEl.getAttribute('data-step-title') || '';
	const label = formString('stepAnnouncement', 'Step %1$s of %2$s')
		.replace('%1$s', String(visibleIndex + 1))
		.replace('%2$s', String(total));

	liveRegion.textContent = title ? `${label}: ${title}` : label;
}

/**
 * Scrolls back to the top of the form after a step change, but only when the
 * top is out of view. The gap above it (scroll-margin-top, see style.css)
 * keeps it clear of the admin bar and sticky theme headers.
 */
function scrollFormIntoView(formEl: HTMLElement) {
	const offset = parseFloat(getComputedStyle(formEl).scrollMarginTop) || 0;
	const top = formEl.getBoundingClientRect().top;
	if (top >= offset && top < window.innerHeight) return;

	const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
	formEl.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
}

function goToStepByVisibleIndex(
	formEl: HTMLElement,
	steps: NodeListOf<HTMLElement>,
	visibleStepIndices: number[],
	visibleIndex: number
) {
	const realIndex = visibleStepIndices[visibleIndex] ?? 0;
	steps.forEach((step, index) => {
		if (index === realIndex) {
			step.style.display = '';
			step.classList.add('streamery-forms-step--active');
			step.classList.remove('streamery-forms-step--hidden');
		} else {
			step.style.display = 'none';
			step.classList.remove('streamery-forms-step--active');
			step.classList.add('streamery-forms-step--hidden');
		}
	});

	const event = new CustomEvent('streamery-forms:stepchange', {
		detail: {
			currentStep: visibleIndex,
			totalSteps: visibleStepIndices.length,
		},
		bubbles: true,
	});
	formEl.dispatchEvent(event);
}

/**
 * Initialize multi-step form logic. Uses visible steps only (steps not hidden by conditional logic).
 */
function initMultiStepForm(
	formEl: HTMLElement,
	steps: NodeListOf<HTMLElement>,
	formOptions: any,
	onStepChange: (step: number) => void
) {
	let currentVisibleIndex = 0;
	let visibleStepIndices = getVisibleStepIndices(formEl);
	const formId = formOptions.formId;

	// Restore saved progress from sessionStorage
	if (formId) {
		try {
			const saved = sessionStorage.getItem(`streamery_forms_progress_${formId}`);
			if (saved) {
				const progressData = JSON.parse(saved);
				if (progressData.fields) {
					restoreFormFields(formEl, progressData.fields);
				}
				// Recompute visible steps after restoring field values
				visibleStepIndices = getVisibleStepIndices(formEl);
				if (typeof progressData.currentStep === 'number' && progressData.currentStep < visibleStepIndices.length) {
					currentVisibleIndex = progressData.currentStep;
				}
			}
		} catch (e) {
			console.error('Failed to restore form progress:', e);
		}
	}

	function refreshVisibleAndGo() {
		visibleStepIndices = getVisibleStepIndices(formEl);
		if (currentVisibleIndex >= visibleStepIndices.length) {
			currentVisibleIndex = Math.max(0, visibleStepIndices.length - 1);
		}
		goToStepByVisibleIndex(formEl, steps, visibleStepIndices, currentVisibleIndex);
		onStepChange(currentVisibleIndex);
		updateStepNavigationButtons(formEl, steps, visibleStepIndices, currentVisibleIndex);
	}

	// Show initial step
	refreshVisibleAndGo();

	formEl.addEventListener('streamery-forms:step-next', ((e: Event) => {
		e.preventDefault();
		visibleStepIndices = getVisibleStepIndices(formEl);
		if (currentVisibleIndex >= visibleStepIndices.length - 1) return;

		const currentStepEl = steps[visibleStepIndices[currentVisibleIndex]];
		if (currentStepEl && !validateStep(currentStepEl)) return;

		currentVisibleIndex++;
		goToStepByVisibleIndex(formEl, steps, visibleStepIndices, currentVisibleIndex);
		onStepChange(currentVisibleIndex);
		updateStepNavigationButtons(formEl, steps, visibleStepIndices, currentVisibleIndex);
		focusStep(formEl, steps[visibleStepIndices[currentVisibleIndex]], currentVisibleIndex, visibleStepIndices.length);
	}) as EventListener);

	formEl.addEventListener('streamery-forms:step-prev', ((e: Event) => {
		e.preventDefault();
		if (currentVisibleIndex <= 0) return;

		currentVisibleIndex--;
		goToStepByVisibleIndex(formEl, steps, visibleStepIndices, currentVisibleIndex);
		onStepChange(currentVisibleIndex);
		updateStepNavigationButtons(formEl, steps, visibleStepIndices, currentVisibleIndex);
		focusStep(formEl, steps[visibleStepIndices[currentVisibleIndex]], currentVisibleIndex, visibleStepIndices.length);
	}) as EventListener);

	formEl.addEventListener('streamery-forms:step-submit', ((e: Event) => {
		e.preventDefault();
		visibleStepIndices = getVisibleStepIndices(formEl);
		const currentStepEl = steps[visibleStepIndices[currentVisibleIndex]];
		if (currentStepEl && !validateStep(currentStepEl)) return;

		const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
		formEl.dispatchEvent(submitEvent);
	}) as EventListener);

	// Re-evaluate visible steps when fields change (for conditional step visibility)
	formEl.addEventListener('input', () => {
		refreshVisibleAndGo();
	});
	formEl.addEventListener('change', () => {
		refreshVisibleAndGo();
	});
}

/**
 * Update step navigation buttons visibility (show/hide prev, swap next/submit).
 * Uses visible step indices so totalSteps = visibleStepIndices.length.
 */
function updateStepNavigationButtons(
	formEl: HTMLElement,
	steps: NodeListOf<HTMLElement>,
	visibleStepIndices: number[],
	currentVisibleIndex: number
) {
	const totalSteps = visibleStepIndices.length;
	const realIndex = visibleStepIndices[currentVisibleIndex];
	const activeStep = realIndex !== undefined ? steps[realIndex] : undefined;
	if (!activeStep) return;

	const navBlock = activeStep.querySelector('.wp-block-streamery-forms-step-navigation');
	if (!navBlock) return;

	const prevBtn = navBlock.querySelector<HTMLElement>('[data-action="prev"]');
	const nextBtn = navBlock.querySelector<HTMLElement>('[data-action="next"]');
	const submitBtn = navBlock.querySelector<HTMLElement>('[data-action="submit"]');

	if (prevBtn) {
		prevBtn.style.display = currentVisibleIndex === 0 ? 'none' : '';
	}

	const isLastStep = currentVisibleIndex === totalSteps - 1;
	if (nextBtn) {
		nextBtn.style.display = isLastStep ? 'none' : '';
	}
	if (submitBtn) {
		submitBtn.style.display = isLastStep ? '' : 'none';
		submitBtn.style.pointerEvents = isLastStep ? '' : 'none';
	}
}

/**
 * Validate required fields in a step. Only validates fields that are visible
 * (not hidden by conditional logic).
 */
function validateStep(stepEl: HTMLElement): boolean {
	const requiredFields = stepEl.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
		'input[required], select[required], textarea[required]'
	);

	let isValid = true;
	const reportedGroups = new Set<string>();

	requiredFields.forEach((field) => {
		// Skip fields hidden by conditional logic -- their own or a container's.
		if (field.closest('.streamery-forms-field--conditional-hidden')) {
			return;
		}
		// Radio/checkbox groups: valid once any option of the group is checked.
		// Their value attribute says nothing about whether one was picked.
		if (field instanceof HTMLInputElement && (field.type === 'radio' || field.type === 'checkbox')) {
			const group = Array.from(
				stepEl.querySelectorAll<HTMLInputElement>(`input[name="${CSS.escape(field.name)}"]`)
			);
			if (group.some((input) => input.checked)) {
				field.classList.remove('streamery-forms-field--invalid');
				return;
			}
			isValid = false;
			field.classList.add('streamery-forms-field--invalid');
			if (!reportedGroups.has(field.name)) {
				reportedGroups.add(field.name);
				field.reportValidity();
			}
			return;
		}
		if (!field.value.trim()) {
			isValid = false;
			field.classList.add('streamery-forms-field--invalid');
			field.reportValidity();
		} else {
			field.classList.remove('streamery-forms-field--invalid');
		}
	});

	return isValid;
}

/**
 * Restore form field values from saved progress data
 */
function restoreFormFields(formEl: HTMLElement, fields: Record<string, string>) {
	Object.entries(fields).forEach(([name, value]) => {
		const field = formEl.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
			`[name="${name}"]`
		);
		if (field) {
			field.value = value;
			// Trigger change event so any listeners can react
			field.dispatchEvent(new Event('change', { bubbles: true }));
		}
	});
}

interface SubmitResult {
	success: boolean;
	message?: string;
	errors?: string[];
	fieldErrors?: Record<string, string>;
	debug?: unknown;
}

/**
 * Submits the form. The payload deliberately carries only the identifier and
 * the field values -- provider selection and settings are resolved server-side
 * (see includes/Core/FormRegistry.php).
 */
async function submitFormWithProviders(
	formData: Record<string, unknown>,
	formIdentifier: string,
	renderedAt: number = 0
): Promise<SubmitResult> {
	try {
		const apiUrl = window.streamery_forms?.apiUrl || '';
		const nonce = window.streamery_forms?.nonce || '';
		const namespace = window.streamery_forms?.namespace || 'streamery-forms/v1';

		const response = await fetch(
			`${apiUrl}${namespace}/submit`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-WP-Nonce': nonce,
				},
				body: JSON.stringify({
					form_identifier: formIdentifier,
					submission_data: formData,
					rendered_at: renderedAt,
				}),
			}
		);

		const result = await response.json();

		if (response.ok && result.success) {
			return {
				success: true,
				message: result.message,
				debug: result.debug || result.data?.debug || null,
			};
		}

		// WP_Error responses put the extra payload under `data`.
		return {
			success: false,
			message: result.message || undefined,
			errors: result.data?.errors || (result.message ? [result.message] : ['Unknown error']),
			fieldErrors: result.data?.field_errors || undefined,
			debug: result.data?.debug || null,
		};
	} catch (error) {
		return {
			success: false,
			errors: ['Network error: ' + (error instanceof Error ? error.message : 'Unknown error')],
		};
	}
}

/**
 * Renders a form-level success or error message.
 */
function showFormMessage(formEl: HTMLElement, type: 'success' | 'error', message: string) {
	clearFormMessage(formEl);

	const box = document.createElement('div');
	box.className = `streamery-forms-form-message streamery-forms-form-message--${type}`;
	box.setAttribute('role', type === 'error' ? 'alert' : 'status');
	box.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
	box.textContent = message;

	formEl.insertBefore(box, formEl.firstChild);
	box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearFormMessage(formEl: HTMLElement) {
	formEl.querySelectorAll('.streamery-forms-form-message').forEach((el) => el.remove());
}

/**
 * Attaches server-side validation errors to their fields, wiring up
 * aria-invalid / aria-describedby so screen readers announce them.
 */
function showFieldErrors(formEl: HTMLElement, fieldErrors: Record<string, string>) {
	Object.entries(fieldErrors).forEach(([fieldName, message]) => {
		const field = formEl.querySelector<HTMLElement>(
			`[name="${CSS.escape(fieldName)}"], [name="${CSS.escape(fieldName + '[]')}"]`
		);
		if (!field) return;

		const wrapper = field.closest('.streamery-forms-field') || field.parentElement;
		if (!wrapper) return;

		field.setAttribute('aria-invalid', 'true');

		const errorEl = document.createElement('p');
		const errorId = `streamery-forms-error-${fieldName.replace(/[^A-Za-z0-9_-]/g, '')}`;
		errorEl.className = 'streamery-forms-field__error';
		errorEl.id = errorId;
		errorEl.textContent = message;

		field.setAttribute('aria-describedby', errorId);
		wrapper.appendChild(errorEl);
	});
}

function clearFieldErrors(formEl: HTMLElement) {
	formEl.querySelectorAll('.streamery-forms-field__error').forEach((el) => el.remove());
	formEl.querySelectorAll('[aria-invalid="true"]').forEach((el) => {
		el.removeAttribute('aria-invalid');
		el.removeAttribute('aria-describedby');
	});
}

/**
 * Moves focus to the first field that failed validation -- and, in a
 * multi-step form, switches to the step that field lives on, so the error
 * isn't announced for something the visitor can't see.
 */
function focusFirstInvalidField(
	formEl: HTMLElement,
	steps: NodeListOf<HTMLElement>,
	isMultiStep: boolean,
	onStepChange: (step: number) => void
) {
	const invalid = formEl.querySelector<HTMLElement>('[aria-invalid="true"]');
	if (!invalid) return;

	if (isMultiStep) {
		const owningStep = invalid.closest('.wp-block-streamery-forms-step');
		if (owningStep) {
			const visibleStepIndices = getVisibleStepIndices(formEl);
			const stepIndex = Array.from(steps).indexOf(owningStep as HTMLElement);
			const visiblePosition = visibleStepIndices.indexOf(stepIndex);
			if (visiblePosition > -1) {
				goToStepByVisibleIndex(formEl, steps, visibleStepIndices, visiblePosition);
				updateStepNavigationButtons(formEl, steps, visibleStepIndices, visiblePosition);
				onStepChange(visiblePosition);
			}
		}
	}

	invalid.focus();
}

/**
 * Shows debug view with debug data
 */
function showDebugView(debugData: any) {
	// Remove existing debug view if any
	const existingDebug = document.getElementById('streamery-forms-debug-view');
	if (existingDebug) {
		existingDebug.remove();
	}

	// Create debug view container
	const debugContainer = document.createElement('div');
	debugContainer.id = 'streamery-forms-debug-view';
	document.body.appendChild(debugContainer);

	// Import and render DebugView component
	// Note: This is a simplified version - in production, you might want to use React
	// For now, we'll create a simple HTML version
	const debugHtml = `
		<div style="position: fixed; bottom: 16px; right: 16px; z-index: 9999; width: 384px; max-width: calc(100vw - 2rem); background: white; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); font-family: system-ui, -apple-system, sans-serif;">
			<div style="padding: 12px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between; cursor: pointer;" onclick="this.parentElement.querySelector('.debug-content').style.display = this.parentElement.querySelector('.debug-content').style.display === 'none' ? 'block' : 'none'; this.querySelector('.chevron').textContent = this.parentElement.querySelector('.debug-content').style.display === 'none' ? '▼' : '▲';">
				<div style="display: flex; align-items: center; gap: 8px;">
					<span style="font-weight: 600; font-size: 14px;">🔍 Debug View</span>
					${debugData.errors && debugData.errors.length > 0 ? `<span style="padding: 2px 8px; font-size: 11px; background: #fee2e2; color: #991b1b; border-radius: 4px;">${debugData.errors.length} error${debugData.errors.length !== 1 ? 's' : ''}</span>` : ''}
				</div>
				<div style="display: flex; align-items: center; gap: 8px;">
					<span class="chevron" style="font-size: 12px; color: #6b7280;">▲</span>
					<button onclick="this.closest('[id=\\'streamery-forms-debug-view\\']').remove();" style="background: none; border: none; color: #6b7280; cursor: pointer; font-size: 16px;">×</button>
				</div>
			</div>
			<div class="debug-content" style="max-height: 600px; overflow-y: auto; padding: 12px; font-size: 12px;">
				<div style="margin-bottom: 16px;">
					<div style="font-weight: 600; margin-bottom: 4px;">Form Identifier</div>
					<div style="color: #6b7280; font-family: monospace; font-size: 11px;">${debugData.form_identifier || 'N/A'}</div>
				</div>
				<div style="margin-bottom: 16px;">
					<div style="font-weight: 600; margin-bottom: 8px;">Providers</div>
					<div style="display: flex; flex-direction: column; gap: 8px;">
						${(debugData.providers || []).map((p: any) => `
							<div style="padding: 8px; background: #f9fafb; border-radius: 4px; border: 1px solid #e5e7eb;">
								<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
									<div style="display: flex; align-items: center; gap: 8px;">
										${p.status === 'success' ? '✅' : p.status === 'failed' ? '❌' : 'ℹ️'}
										<span style="font-weight: 500;">${p.name || p.slug}</span>
									</div>
									<span style="font-size: 11px; color: ${p.status === 'success' ? '#16a34a' : p.status === 'failed' ? '#dc2626' : '#6b7280'};">${p.status}</span>
								</div>
								${p.feed_name ? `<div style="font-size: 11px; color: #6b7280; margin-top: 4px;">Feed: ${p.feed_name}</div>` : ''}
							</div>
						`).join('')}
					</div>
				</div>
				${debugData.errors && debugData.errors.length > 0 ? `
					<div style="margin-bottom: 16px;">
						<div style="font-weight: 600; margin-bottom: 8px; color: #dc2626; display: flex; align-items: center; gap: 4px;">⚠️ Errors</div>
						<div style="display: flex; flex-direction: column; gap: 4px;">
							${debugData.errors.map((e: string) => `
								<div style="padding: 8px; background: #fee2e2; border-radius: 4px; color: #991b1b; font-size: 11px;">${e}</div>
							`).join('')}
						</div>
					</div>
				` : ''}
				<div style="margin-bottom: 16px;">
					<div style="font-weight: 600; margin-bottom: 8px;">Payload</div>
					<pre style="padding: 8px; background: #f9fafb; border-radius: 4px; font-size: 11px; overflow-x: auto; font-family: monospace;">${JSON.stringify(debugData.payload || {}, null, 2)}</pre>
				</div>
				<div>
					<div style="font-weight: 600; margin-bottom: 8px;">Results</div>
					<pre style="padding: 8px; background: #f9fafb; border-radius: 4px; font-size: 11px; overflow-x: auto; font-family: monospace;">${JSON.stringify(debugData.results || {}, null, 2)}</pre>
				</div>
			</div>
		</div>
	`;

	debugContainer.innerHTML = debugHtml;
}

/**
 * Load skin CSS dynamically. A skin registered via the 'streamery-forms/skins'
 * filter brings its own URL; a skin that extends another loads its base
 * first so the cascade is base -> child. `seen` guards against extends cycles.
 */
function loadSkinCSS(skinName: string, seen: Set<string> = new Set()) {
	if (seen.has(skinName)) {
		return;
	}
	seen.add(skinName);

	const skin = getRegisteredSkins().find((entry) => entry.name === skinName);
	if (skin?.extends) {
		loadSkinCSS(skin.extends, seen);
	}

	// Check if skin CSS is already loaded
	const existingLink = document.querySelector(`link[data-streamery-forms-skin="${CSS.escape(skinName)}"]`);
	if (existingLink) {
		return;
	}

	const link = document.createElement('link');
	link.rel = 'stylesheet';
	if (skin?.url) {
		link.href = skin.url;
	} else {
		// Fallback: built skins in assets/blocks/skins
		const assetsUrl = (window as any).streamery_forms?.assetsUrl || '';
		link.href = `${assetsUrl}/blocks/skins/${skinName}/index.css`;
	}
	link.setAttribute('data-streamery-forms-skin', skinName);
	document.head.appendChild(link);
}
