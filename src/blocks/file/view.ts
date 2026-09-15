/**
 * File Upload Field View Script
 * 
 * Handles drag-and-drop, file selection, URL upload, and progress tracking
 * for the file upload field block.
 */

/**
 * Frontend strings for this view script.
 *
 * These are announced by screen readers, so they must be translatable rather
 * than hardcoded English. They're localized from PHP onto window.streamery_forms
 * (see includes/Assets/Frontend.php); the second argument is the English
 * fallback used when no translation is present.
 */
function t(key: string, fallback: string): string {
	const strings = (window as any).streamery_forms?.strings || {};
	return strings[key] || fallback;
}

interface UploadedFile {
	url: string;
	name: string;
	original_name: string;
	type: string;
	size: number;
	token: string;
}

interface FileUploadState {
	file: File;
	progress: number;
	status: 'pending' | 'uploading' | 'success' | 'error';
	error?: string;
	uploadedFile?: UploadedFile;
}

window.addEventListener('DOMContentLoaded', () => {
	const fileUploadFields = document.querySelectorAll<HTMLElement>('.streamery-forms-file-upload-field');
	
	fileUploadFields.forEach((field) => {
		initFileUploadField(field);
	});
});

function initFileUploadField(field: HTMLElement) {
	const uploadZone = field.querySelector<HTMLElement>('.streamery-forms-file-upload-zone');
	const fileInput = field.querySelector<HTMLInputElement>('.streamery-forms-file-input');
	const fileList = field.querySelector<HTMLElement>('.streamery-forms-file-upload-list');

	if (!uploadZone || !fileInput || !fileList) {
		return;
	}

	const fieldName = field.getAttribute('data-field-name') || '';
	const fieldId = field.getAttribute('data-field-id') || '';
	const multiple = field.getAttribute('data-multiple') === 'true';
	const acceptTypes = field.getAttribute('data-accept-types') || '';
	const maxFileSize = parseInt(field.getAttribute('data-max-file-size') || '0', 10);
	const maxFiles = parseInt(field.getAttribute('data-max-files') || '5', 10);

	const uploadedFiles: UploadedFile[] = [];
	const uploadStates = new Map<File, FileUploadState>();

	// Drag and drop handlers
	uploadZone.addEventListener('dragover', (e) => {
		e.preventDefault();
		e.stopPropagation();
		uploadZone.classList.add('streamery-forms-file-upload-zone--dragover');
	});

	uploadZone.addEventListener('dragleave', (e) => {
		e.preventDefault();
		e.stopPropagation();
		uploadZone.classList.remove('streamery-forms-file-upload-zone--dragover');
	});

	uploadZone.addEventListener('drop', (e) => {
		e.preventDefault();
		e.stopPropagation();
		uploadZone.classList.remove('streamery-forms-file-upload-zone--dragover');
		
		const files = Array.from(e.dataTransfer?.files || []);
		handleFiles(files);
	});

	// Click to select files
	uploadZone.addEventListener('click', () => {
		fileInput.click();
	});

	// File input change
	fileInput.addEventListener('change', (e) => {
		const target = e.target as HTMLInputElement;
		const files = Array.from(target.files || []);
		handleFiles(files);
		// Reset input to allow selecting the same file again
		target.value = '';
	});

	function handleFiles(files: File[]) {
		// Check max files limit
		if (multiple && uploadedFiles.length + files.length > maxFiles) {
			showError(`Maximum ${maxFiles} files allowed.`);
			return;
		}

		if (!multiple && files.length > 1) {
			files = [files[0]];
		}

		if (!multiple && uploadedFiles.length > 0) {
			// Replace existing file
			uploadedFiles.length = 0;
			fileList.innerHTML = '';
			uploadStates.clear();
		}

		files.forEach((file) => {
			// Validate file size
			const fileSizeMB = file.size / 1024 / 1024;
			const wpMaxSize = getWordPressUploadLimit();
			const effectiveMax = maxFileSize > 0 ? Math.min(maxFileSize, wpMaxSize) : wpMaxSize;

			if (fileSizeMB > effectiveMax) {
				showError(`File "${file.name}" is too large. Maximum size is ${effectiveMax} MB.`);
				return;
			}

			// Validate file type
			if (acceptTypes && !validateFileType(file, acceptTypes)) {
				showError(`File "${file.name}" has an invalid file type.`);
				return;
			}

			// Create upload state
			const state: FileUploadState = {
				file,
				progress: 0,
				status: 'pending',
			};
			uploadStates.set(file, state);

			// Add to UI
			const fileItem = createFileItem(file, state);
			fileList.appendChild(fileItem);

			// Start upload
			uploadFile(file, state, fileItem);
		});
	}

	function uploadFile(file: File, state: FileUploadState, fileItem: HTMLElement) {
		state.status = 'uploading';
		updateFileItem(fileItem, state);

		const formData = new FormData();
		formData.append('file', file);
		formData.append('field_name', fieldName);
		if (maxFileSize > 0) {
			formData.append('max_file_size', maxFileSize.toString());
		}
		if (acceptTypes) {
			formData.append('accept_types', acceptTypes);
		}

		const apiUrl = (window as any).streamery_forms?.apiUrl || '';
		const nonce = (window as any).streamery_forms?.nonce || '';
		const namespace = (window as any).streamery_forms?.namespace || 'streamery-forms/v1';

		const xhr = new XMLHttpRequest();

		// Progress tracking
		xhr.upload.addEventListener('progress', (e) => {
			if (e.lengthComputable) {
				state.progress = Math.round((e.loaded / e.total) * 100);
				updateFileItem(fileItem, state);
			}
		});

		// Success
		xhr.addEventListener('load', () => {
			if (xhr.status === 200) {
				try {
					const response = JSON.parse(xhr.responseText);
				if (response.success && response.files && response.files.length > 0) {
					state.status = 'success';
					state.uploadedFile = response.files[0];
					uploadedFiles.push(response.files[0]);
					updateHiddenInput();
					updateFileItem(fileItem, state);
				} else {
						state.status = 'error';
						state.error = response.message || 'Upload failed';
						updateFileItem(fileItem, state);
					}
				} catch (e) {
					state.status = 'error';
					state.error = 'Failed to parse response';
					updateFileItem(fileItem, state);
				}
			} else {
				state.status = 'error';
				try {
					const response = JSON.parse(xhr.responseText);
					state.error = response.message || `Upload failed with status ${xhr.status}`;
				} catch (e) {
					state.error = `Upload failed with status ${xhr.status}`;
				}
				updateFileItem(fileItem, state);
			}
		});

		// Error
		xhr.addEventListener('error', () => {
			state.status = 'error';
			state.error = 'Network error';
			updateFileItem(fileItem, state);
		});

		// Abort
		xhr.addEventListener('abort', () => {
			state.status = 'error';
			state.error = 'Upload cancelled';
			updateFileItem(fileItem, state);
		});

		xhr.open('POST', `${apiUrl}${namespace}/upload`);
		xhr.setRequestHeader('X-WP-Nonce', nonce);
		xhr.send(formData);
	}

	function createFileItem(file: File, state: FileUploadState): HTMLElement {
		const item = document.createElement('div');
		item.className = 'streamery-forms-file-item';
		item.dataset.fileName = file.name;
		updateFileItem(item, state);
		return item;
	}

	function updateFileItem(item: HTMLElement, state: FileUploadState) {
		const file = state.file;
		const fileName = file.name;
		const fileSize = formatFileSize(file.size);

		if (state.status === 'uploading') {
			item.innerHTML = `
				<div class="streamery-forms-file-item-info">
					<span class="streamery-forms-file-item-name">${escapeHtml(fileName)}</span>
					<span class="streamery-forms-file-item-size">${fileSize}</span>
				</div>
				<div class="streamery-forms-file-item-progress">
					<div class="streamery-forms-file-item-progress-bar" style="width: ${state.progress}%"></div>
					<span class="streamery-forms-file-item-progress-text">${state.progress}%</span>
				</div>
				<button type="button" class="streamery-forms-file-item-cancel" aria-label="${escapeHtml(t('cancelUpload', 'Cancel upload'))}">×</button>
			`;
			
			const cancelBtn = item.querySelector('.streamery-forms-file-item-cancel');
			if (cancelBtn) {
				cancelBtn.addEventListener('click', () => {
					// Cancel upload (would need to track xhr to abort)
					item.remove();
					uploadStates.delete(file);
				});
			}
		} else if (state.status === 'success' && state.uploadedFile) {
			const uploadedFile = state.uploadedFile;
			const isImage = uploadedFile.type.startsWith('image/');
			
			item.innerHTML = `
				<div class="streamery-forms-file-item-info">
					${isImage ? `<img src="${escapeHtml(uploadedFile.url)}" alt="${escapeHtml(uploadedFile.name)}" class="streamery-forms-file-item-thumbnail" />` : ''}
					<span class="streamery-forms-file-item-name">${escapeHtml(uploadedFile.original_name || uploadedFile.name)}</span>
					<span class="streamery-forms-file-item-size">${fileSize}</span>
				</div>
				<button type="button" class="streamery-forms-file-item-remove" aria-label="${escapeHtml(t('removeFile', 'Remove file'))}">×</button>
			`;
			
			const removeBtn = item.querySelector('.streamery-forms-file-item-remove');
			if (removeBtn) {
				removeBtn.addEventListener('click', () => {
					const index = uploadedFiles.findIndex(f => f.url === uploadedFile.url);
					if (index > -1) {
						uploadedFiles.splice(index, 1);
						updateHiddenInput();
					}
					item.remove();
				});
			}
		} else if (state.status === 'error') {
			item.innerHTML = `
				<div class="streamery-forms-file-item-info">
					<span class="streamery-forms-file-item-name">${escapeHtml(fileName)}</span>
					<span class="streamery-forms-file-item-error">${escapeHtml(state.error || 'Upload failed')}</span>
				</div>
				<button type="button" class="streamery-forms-file-item-remove" aria-label="${escapeHtml(t('removeFile', 'Remove file'))}">×</button>
			`;
			
			const removeBtn = item.querySelector('.streamery-forms-file-item-remove');
			if (removeBtn) {
				removeBtn.addEventListener('click', () => {
					item.remove();
					uploadStates.delete(file);
				});
			}
		}
	}

	function validateFileType(file: File, acceptTypes: string): boolean {
		const accepted = acceptTypes.split(',').map(t => t.trim());
		const fileType = file.type;
		const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

		return accepted.some((accept) => {
			// Check MIME type (e.g., image/*, application/pdf)
			if (accept.includes('*')) {
				const pattern = accept.replace('*', '.*');
				const regex = new RegExp('^' + pattern.replace(/\./g, '\\.') + '$', 'i');
				return regex.test(fileType);
			} else if (accept === fileType) {
				return true;
			}

			// Check file extension (e.g., .pdf, .jpg)
			if (accept.startsWith('.')) {
				return accept.toLowerCase() === fileExtension;
			}

			return false;
		});
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
	}

	function getWordPressUploadLimit(): number {
		// This would ideally come from PHP, but we'll use a reasonable default
		return 64; // 64 MB default
	}

	function escapeHtml(text: string): string {
		const div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML;
	}

	function showError(message: string) {
		// Create temporary error message
		const errorDiv = document.createElement('div');
		errorDiv.className = 'streamery-forms-file-upload-error';
		errorDiv.textContent = message;
		field.appendChild(errorDiv);
		
		setTimeout(() => {
			errorDiv.remove();
		}, 5000);
	}

	// Store uploaded files in a hidden input for form submission
	const hiddenInput = document.createElement('input');
	hiddenInput.type = 'hidden';
	hiddenInput.name = fieldName;
	hiddenInput.id = fieldId + '_files';
	field.appendChild(hiddenInput);

	// Update hidden input when files change
	function updateHiddenInput() {
		hiddenInput.value = JSON.stringify(uploadedFiles);
	}

	// updateHiddenInput is called explicitly after each file operation
}

