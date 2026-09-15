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
 
window.addEventListener('DOMContentLoaded', () => {
	const success = document.querySelectorAll('.wp-block-streamery-forms-success');
	success.forEach(success => {
		const form = success.closest('.wp-block-streamery-forms-form');
		if(!form) return;

        const modal = document.createElement('div');
        modal.className = 'streamery-forms-success-modal';
        
        const content = document.createElement('div');
        content.className = 'streamery-forms-success-modal-content';
        content.innerHTML = success.innerHTML;
        
        // Create close button
        const closeButton = document.createElement('button');
        closeButton.className = 'streamery-forms-success-modal-close';
        closeButton.setAttribute('aria-label', 'Close');
        closeButton.innerHTML = '×';
        closeButton.type = 'button';
        
        // Close modal function - hide modal and remove success class
        const closeModal = () => {
            form.classList.remove('streamery-forms-form--success-view');
        };
        
        // Close button click handler
        closeButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeModal();
        });
        
        // Close on outside click (click on modal overlay, not content)
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Prevent content clicks from closing modal
        content.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        content.appendChild(closeButton);
        modal.appendChild(content);
        form.appendChild(modal);

        success.remove();
	});
});
