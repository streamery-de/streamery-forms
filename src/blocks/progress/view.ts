/**
 * Progress block frontend logic.
 * Builds the progress UI dynamically and listens for step change events.
 */

window.addEventListener('DOMContentLoaded', () => {
	const progressBlocks = document.querySelectorAll<HTMLElement>('.wp-block-streamery-forms-progress');

	progressBlocks.forEach((progressEl) => {
		const form = progressEl.closest('.wp-block-streamery-forms-form');
		if (!form) return;

		const variant = progressEl.getAttribute('data-variant') || 'bubbles';

		function getVisibleStepTitles(): string[] {
			const steps = form.querySelectorAll<HTMLElement>('.wp-block-streamery-forms-step');
			return Array.from(steps)
				.filter((step) => !step.classList.contains('streamery-forms-step--conditional-hidden'))
				.map((step, index) => step.getAttribute('data-step-title') || `Step ${index + 1}`);
		}

		const stepTitles = getVisibleStepTitles();
		const totalSteps = stepTitles.length;

		if (totalSteps === 0) return;

		// Build initial UI (visible steps only)
		buildProgressUI(progressEl, variant, stepTitles, 0, totalSteps);

		// Listen for step changes (event already sends visible currentStep and totalSteps)
		form.addEventListener('streamery-forms:stepchange', ((e: CustomEvent) => {
			const { currentStep, totalSteps: eventTotal } = e.detail;
			const titles = getVisibleStepTitles();
			buildProgressUI(progressEl, variant, titles, currentStep, eventTotal);
		}) as EventListener);
	});
});

function buildProgressUI(
	container: HTMLElement,
	variant: string,
	stepTitles: string[],
	currentStep: number,
	totalSteps: number
) {
	container.innerHTML = '';

	if (variant === 'bar') {
		buildBarUI(container, currentStep, totalSteps);
	} else {
		buildBubblesUI(container, stepTitles, currentStep, totalSteps);
	}
}

function buildBarUI(container: HTMLElement, currentStep: number, totalSteps: number) {
	const percent = totalSteps > 1
		? Math.round((currentStep / (totalSteps - 1)) * 100)
		: 100;

	const bar = document.createElement('div');
	bar.className = 'streamery-forms-progress-bar';

	const track = document.createElement('div');
	track.className = 'streamery-forms-progress-bar__track';

	const fill = document.createElement('div');
	fill.className = 'streamery-forms-progress-bar__fill';
	fill.style.width = `${percent}%`;

	const label = document.createElement('div');
	label.className = 'streamery-forms-progress-bar__label';
	label.textContent = `${percent}%`;

	track.appendChild(fill);
	bar.appendChild(track);
	bar.appendChild(label);
	container.appendChild(bar);
}

function buildBubblesUI(
	container: HTMLElement,
	stepTitles: string[],
	currentStep: number,
	totalSteps: number
) {
	const bubbles = document.createElement('div');
	bubbles.className = 'streamery-forms-progress-bubbles';

	stepTitles.forEach((title, index) => {
		const bubble = document.createElement('div');
		bubble.className = 'streamery-forms-progress-bubble';

		if (index < currentStep) {
			bubble.classList.add('streamery-forms-progress-bubble--completed');
		} else if (index === currentStep) {
			bubble.classList.add('streamery-forms-progress-bubble--active');
		}

		const circle = document.createElement('div');
		circle.className = 'streamery-forms-progress-bubble__circle';
		circle.textContent = String(index + 1);

		const titleEl = document.createElement('div');
		titleEl.className = 'streamery-forms-progress-bubble__title';
		titleEl.textContent = title;

		bubble.appendChild(circle);
		bubble.appendChild(titleEl);

		if (index < totalSteps - 1) {
			const line = document.createElement('div');
			line.className = 'streamery-forms-progress-bubble__line';
			if (index < currentStep) {
				line.classList.add('streamery-forms-progress-bubble__line--completed');
			}
			bubble.appendChild(line);
		}

		bubbles.appendChild(bubble);
	});

	container.appendChild(bubbles);
}
