/**
 * "Custom option" for checkbox/radio groups: the last option carries a text
 * field instead of a fixed label. Its checkbox/radio has no fixed value; the
 * typed text becomes the value, so FormData picks it up like any other option.
 * The text field itself has no name and is never submitted.
 */
export function initCustomOptions(fieldSelector: string, optionClass: string): void {
	document.querySelectorAll<HTMLElement>(`${fieldSelector} .${optionClass}--custom`).forEach((option) => {
		const choice = option.querySelector<HTMLInputElement>('input[data-custom-option]');
		const text = option.querySelector<HTMLInputElement>('.streamery-forms-custom-option-input');
		const group = option.closest<HTMLElement>(fieldSelector);
		if (!choice || !text || !group) {
			return;
		}

		// A checked custom option must not be sent empty.
		const syncRequired = () => {
			text.required = choice.checked;
		};

		text.addEventListener('input', () => {
			choice.value = text.value.trim();
			const shouldCheck = choice.value !== '';
			if (choice.checked !== shouldCheck) {
				choice.checked = shouldCheck;
				choice.dispatchEvent(new Event('change', { bubbles: true }));
			}
			syncRequired();
		});

		// Typing into the field must not toggle the option via the label.
		text.addEventListener('click', (event) => event.stopPropagation());

		choice.addEventListener('change', () => {
			if (choice.checked && text.value.trim() === '') {
				text.focus();
			}
		});

		// Radios uncheck silently when a sibling is picked, so listen on the group.
		group.addEventListener('change', syncRequired);
		syncRequired();
	});
}
