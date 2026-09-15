import { __ } from '../../lib/i18n';
import { Button, TextControl } from '@wordpress/components';
import { type Option } from '../OptionsRepeater';
import './styles.css';

interface NewOptionRowProps {
	newOption: Option;
	syncLabelValue: boolean;
	onChange: (option: Option) => void;
	onAdd: () => void;
	showDescription?: boolean;
}

export const NewOptionRow = ({ newOption, syncLabelValue, onChange, onAdd, showDescription = false }: NewOptionRowProps) => {
	const handleLabelChange = (label: string) => {
		// If sync is enabled, automatically set value to label
		const updatedOption = syncLabelValue
			? { ...newOption, label, value: label }
			: { ...newOption, label };
		onChange(updatedOption);
	};

	const handleValueChange = (value: string) => {
		onChange({ ...newOption, value });
	};

	const handleDescriptionChange = (description: string) => {
		onChange({ ...newOption, description });
	};

	const canAdd = syncLabelValue
		? newOption.label
		: newOption.label && newOption.value;

	return (
		<tr className="streamery-forms-options-table-row-new">
			<td></td>
			<td></td>
			<td>
				<TextControl
					value={newOption.label}
					onChange={handleLabelChange}
					placeholder={__('newLabel')}
					__next40pxDefaultSize={true}
					__nextHasNoMarginBottom={true}
					onKeyDown={(e) => {
						if (e.key === 'Enter' && canAdd) {
							onAdd();
						}
					}}
				/>
			</td>
			<td>
				<TextControl
					value={newOption.value}
					onChange={handleValueChange}
					placeholder={__('newValue')}
					disabled={syncLabelValue}
					__next40pxDefaultSize={true}
					__nextHasNoMarginBottom={true}
					onKeyDown={(e) => {
						if (e.key === 'Enter' && canAdd) {
							onAdd();
						}
					}}
				/>
			</td>
			{showDescription && (
				<td>
					<TextControl
						value={newOption.description ?? ''}
						onChange={handleDescriptionChange}
						placeholder={__('description', 'Beschreibung')}
						__next40pxDefaultSize={true}
						__nextHasNoMarginBottom={true}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && canAdd) {
								onAdd();
							}
						}}
					/>
				</td>
			)}
			<td className="streamery-forms-options-table-td-actions">
				<Button
					onClick={onAdd}
					variant="primary"
					isSmall
					disabled={!canAdd}
				>
					{__('add')}
				</Button>
			</td>
		</tr>
	);
};

