import { __ } from '../../lib/i18n';
import { Button } from '@wordpress/components';
import './styles.css';

interface ModalFooterProps {
	hasOptions: boolean;
	onClose: () => void;
	onSave: () => void;
}

export const ModalFooter = ({ hasOptions, onClose, onSave }: ModalFooterProps) => {
	return (
		<div className="streamery-forms-options-modal-footer">
			
			<Button onClick={onClose} variant="secondary">
				{__('cancel')}
			</Button>
			{hasOptions && (
				<Button onClick={onSave} variant="primary">
					{__('save')}
				</Button>
			)}
		</div>
	);
};

