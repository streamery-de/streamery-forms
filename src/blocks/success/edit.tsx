import { __ } from "@/lib/i18n";
import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';
import { type BlockEditProps } from '@wordpress/blocks';
import { type SuccessAttributes } from '@/blockTypes/success';
import './editor.css';
import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useFormBlock } from './use-form-block';
import { ModalCloseButton } from './modal-close-button';

export default function Edit(props: BlockEditProps<SuccessAttributes>) {
	const { clientId } = props;
	const successRef = useRef<HTMLDivElement>(null);
	const modalRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const [form, setForm] = useState<HTMLDivElement | null>(null);
	
	const formBlock = useFormBlock(clientId);
	const { updateBlockAttributes } = useDispatch('core/block-editor');
	const successView = formBlock?.attributes?.successView ?? false;

	const closeModal = useCallback(() => {
		if (formBlock) {
			updateBlockAttributes(formBlock.clientId, { successView: false });
		}
	}, [formBlock, updateBlockAttributes]);

	// IMPORTANT: useBlockProps() must be called unconditionally to follow Rules of Hooks
	// It must be called before any conditional returns
	const blockProps = useBlockProps();

	// Find the form element in the DOM
	// Re-run when successView changes to ensure we find the form when needed
	useEffect(() => {
		const findForm = () => {
			if (successRef.current) {
				const formElement = successRef.current.closest('.wp-block-streamery-forms-form');
				if (formElement) {
					setForm(formElement as HTMLDivElement);
					return true;
				}
			}
			return false;
		};

		// Try to find immediately
		if (findForm()) {
			return;
		}

		// If not found and successView is active, try again after a short delay
		// This handles cases where the DOM hasn't updated yet
		if (successView) {
			const timeoutId = setTimeout(() => {
				findForm();
			}, 0);

			return () => clearTimeout(timeoutId);
		}
	}, [successView]);

	// Handle modal click events
	useEffect(() => {
		if (!modalRef.current || !successView) return;

		const modal = modalRef.current;
		const content = contentRef.current;

		const handleModalClick = (e: MouseEvent) => {
			if (e.target === modal) {
				closeModal();
			}
		};

		const handleContentClick = (e: MouseEvent) => {
			e.stopPropagation();
		};

		modal.addEventListener('click', handleModalClick);
		if (content) {
			content.addEventListener('click', handleContentClick);
		}

		return () => {
			modal.removeEventListener('click', handleModalClick);
			if (content) {
				content.removeEventListener('click', handleContentClick);
			}
		};
	}, [successView, closeModal]);

	// Success modal content
	const SuccessContent = (
		<div {...blockProps}>
			<InnerBlocks
				allowedBlocks={['core/heading', 'core/paragraph']}
				template={[
					['core/heading', { content: 'Thank you for your submission!' }],
					['core/paragraph', { content: 'We will get back to you as soon as possible.' }],
				]}
			/>
		</div>
	);

	return (
		<div ref={successRef}>
			{form && createPortal((
				<div ref={modalRef} className="streamery-forms-success-modal">
					<div ref={contentRef} className="streamery-forms-success-modal-content">
						<ModalCloseButton onClose={closeModal} />
						{SuccessContent}
					</div>
				</div>
			), form)}
		</div>
	);
}
