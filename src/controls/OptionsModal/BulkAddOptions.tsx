import { useState } from '@wordpress/element';
import { Button, TextareaControl, Modal } from '@wordpress/components';
import { __ } from '../../lib/i18n';
import { type Option } from '../OptionsRepeater';
import './styles.css';

interface BulkAddOptionsProps {
	isOpen: boolean;
	onClose: () => void;
	onAdd: (options: Option[]) => void;
	syncLabelValue: boolean;
}

export const BulkAddOptions = ({
	isOpen,
	onClose,
	onAdd,
	syncLabelValue,
}: BulkAddOptionsProps) => {
	const [bulkText, setBulkText] = useState('');

	const parseBulkOptions = (text: string): Option[] => {
		if (!text.trim()) return [];

		const options: Option[] = [];
		const lines = text.split(',').map(line => line.trim()).filter(line => line.length > 0);

		for (const line of lines) {
			if (line.includes(':')) {
				// Format: Label:value
				const [label, ...valueParts] = line.split(':');
				const value = valueParts.join(':'); // In case value contains colons
				if (label.trim() && value.trim()) {
					options.push({
						label: label.trim(),
						value: value.trim(),
					});
				}
			} else {
				// Format: Label (label = value)
				const label = line.trim();
				if (label) {
					options.push({
						label: label,
						value: syncLabelValue ? label : label.toLowerCase().replace(/\s+/g, '-'),
					});
				}
			}
		}

		return options;
	};

	const handleAdd = () => {
		const parsedOptions = parseBulkOptions(bulkText);
		if (parsedOptions.length > 0) {
			onAdd(parsedOptions);
			setBulkText('');
			onClose();
		}
	};

	const handleClose = () => {
		setBulkText('');
		onClose();
	};

	if (!isOpen) return null;

	return (
		<Modal
			title={__('addBulkOptions')}
			onRequestClose={handleClose}
			className="streamery-forms-bulk-add-options-modal"
		>
			<div className="streamery-forms-bulk-add-options-content">
				<TextareaControl
					label={__('bulkOptionsPlaceholder')}
					value={bulkText}
					onChange={setBulkText}
					rows={8}
					placeholder={__('bulkOptionsExample')}
					help={__('bulkOptionsExample')}
					__nextHasNoMarginBottom={true}
				/>
				<div className="streamery-forms-bulk-add-options-footer">
					<Button onClick={handleClose} variant="secondary">
						{__('cancel')}
					</Button>
					<Button
						onClick={handleAdd}
						variant="primary"
						disabled={!bulkText.trim()}
					>
						{__('addOptions')}
					</Button>
				</div>
			</div>
		</Modal>
	);
};

