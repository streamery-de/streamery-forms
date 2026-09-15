import { __ } from '../../lib/i18n';
import { Button, CheckboxControl } from '@wordpress/components';
import { X } from 'lucide-react';
import BlockIcon from '../../components/block-atoms/BlockIcon';
import './styles.css';

interface ModalHeaderProps {
	onClose: () => void;
	syncLabelValue: boolean;
	onSyncChange: (sync: boolean) => void;
}

export const ModalHeader = ({ onClose, syncLabelValue, onSyncChange }: ModalHeaderProps) => {
	return (
		<div className="streamery-forms-options-modal-header">
			<div className="streamery-forms-options-modal-header__content">
				<h2 className="streamery-forms-options-modal-header__title">{__('manageOptions')}</h2>
				<CheckboxControl
					label={__('syncLabelAndValue')}
					checked={syncLabelValue}
					onChange={onSyncChange}
					__nextHasNoMarginBottom={true}
				/>
			</div>
			<Button onClick={onClose} icon={<BlockIcon icon={X} clean={true} />} isSmall variant="tertiary" />
		</div>
	);
};

