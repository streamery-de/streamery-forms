/**
 * HoneyPot Block Frontend Script
 * Validates that the honeypot field is empty on form submission
 */

window.addEventListener('DOMContentLoaded', () => {
	const forms = document.querySelectorAll('.wp-block-streamery-forms-form');
	
	forms.forEach((form) => {
		form.addEventListener('submit', (e) => {
			const honeypotFields = form.querySelectorAll<HTMLInputElement>('.streamery-forms-honeypot input[type="text"]');
			
			honeypotFields.forEach((field) => {
				if (field.value && field.value.trim() !== '') {
					// HoneyPot field was filled - this is likely spam
					e.preventDefault();
					console.warn('HoneyPot field was filled. Submission blocked.');
					
					// Optionally show error message
					const errorMsg = document.createElement('div');
					errorMsg.className = 'streamery-forms-error';
					errorMsg.textContent = 'Spam detected. Please try again.';
					errorMsg.style.cssText = 'color: red; padding: 10px; margin: 10px 0; background: #fee; border: 1px solid #fcc; border-radius: 4px;';
					form.insertBefore(errorMsg, form.firstChild);
					
					return false;
				}
			});
		});
	});
});

