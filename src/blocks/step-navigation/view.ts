/**
 * Step Navigation frontend logic.
 * Handles next/prev/submit button clicks within a multi-step form.
 */

window.addEventListener('DOMContentLoaded', () => {
	const navBlocks = document.querySelectorAll('.wp-block-streamery-forms-step-navigation');

	navBlocks.forEach((nav) => {
		const form = nav.closest('.wp-block-streamery-forms-form') as HTMLFormElement | null;
		if (!form) return;

		const prevBtn = nav.querySelector<HTMLButtonElement>('[data-action="prev"]');
		const nextBtn = nav.querySelector<HTMLButtonElement>('[data-action="next"]');
		const submitBtn = nav.querySelector<HTMLButtonElement>('[data-action="submit"]');

		if (prevBtn) {
			prevBtn.addEventListener('click', (e) => {
				e.preventDefault();
				const event = new CustomEvent('streamery-forms:step-prev', { bubbles: true });
				form.dispatchEvent(event);
			});
		}

		if (nextBtn) {
			nextBtn.addEventListener('click', (e) => {
				e.preventDefault();
				const event = new CustomEvent('streamery-forms:step-next', { bubbles: true });
				form.dispatchEvent(event);
			});
		}

		if (submitBtn) {
			submitBtn.addEventListener('click', (e) => {
				e.preventDefault();
				const event = new CustomEvent('streamery-forms:step-submit', { bubbles: true });
				form.dispatchEvent(event);
			});
		}
	});
});
