import { __ } from "@/lib/i18n";

type ModalCloseButtonProps = {
	onClose: () => void;
};

export const ModalCloseButton = ({ onClose }: ModalCloseButtonProps) => {
	return (
		<button
			type="button"
			className="streamery-forms-success-modal-close"
			onClick={(e) => {
				e.preventDefault();
				e.stopPropagation();
				onClose();
			}}
			aria-label={__('close')}
		>
			×
		</button>
	);
};

