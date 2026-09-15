/**
 * Populated select fields: client-side fallback when render-time injection
 * did not run (e.g. cached HTML). Primary population happens server-side via
 * the streamery-forms/select/populated_options filter in PopulatedSelect.php.
 */

type PopulatedOption = {
	label: string;
	value: string;
};

type StreameryFormsWindow = {
	apiUrl?: string;
	namespace?: string;
	nonce?: string;
	postId?: number;
};

function getStreameryForms(): StreameryFormsWindow {
	return (window as Window & { streamery_forms?: StreameryFormsWindow }).streamery_forms || {};
}

function appendOptions(select: HTMLSelectElement, options: PopulatedOption[]): void {
	options.forEach((option) => {
		const opt = document.createElement('option');
		opt.value = option.value;
		opt.textContent = option.label;
		select.appendChild(opt);
	});
}

async function fetchPopulatedOptions(fieldName: string, postId: number): Promise<PopulatedOption[]> {
	const { apiUrl = '', namespace = 'streamery-forms/v1', nonce = '' } = getStreameryForms();
	const params = new URLSearchParams({ field_name: fieldName, post_id: String(postId) });
	const response = await fetch(`${apiUrl}${namespace}/select/populated-options?${params.toString()}`, {
		headers: { 'X-WP-Nonce': nonce },
	});

	if (!response.ok) {
		return [];
	}

	const payload = await response.json();
	return Array.isArray(payload?.options) ? payload.options : [];
}

async function populateSelect(select: HTMLSelectElement, postId: number): Promise<void> {
	if (select.options.length > 1) {
		return;
	}

	const fieldName = select.name;
	if (!fieldName) {
		return;
	}

	const event = new CustomEvent('streamery-forms:populate-select', {
		bubbles: true,
		cancelable: true,
		detail: { select, fieldName, postId },
	});

	if (!select.dispatchEvent(event)) {
		return;
	}

	const options = await fetchPopulatedOptions(fieldName, postId);
	if (options.length > 0) {
		appendOptions(select, options);
	}
}

function initPopulatedSelects(): void {
	const postId = getStreameryForms().postId || 0;
	if (!postId) {
		return;
	}

	document.querySelectorAll<HTMLSelectElement>('select[data-populated="true"]').forEach((select) => {
		void populateSelect(select, postId);
	});
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initPopulatedSelects);
} else {
	initPopulatedSelects();
}
