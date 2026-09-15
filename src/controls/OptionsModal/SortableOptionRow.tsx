import { __ } from '../../lib/i18n';
import { Button, TextControl, CheckboxControl } from '@wordpress/components';
import { GripVertical, Trash2 } from 'lucide-react';
import BlockIcon from '../../components/block-atoms/BlockIcon';
import { type Option } from '../OptionsRepeater';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './styles.css';

interface SortableOptionRowProps {
	option: Option;
	index: number;
	syncLabelValue: boolean;
	onChange: (index: number, option: Option) => void;
	onDelete: (index: number) => void;
	isSelected: boolean;
	onSelect: (index: number, selected: boolean) => void;
	showDescription?: boolean;
}

export const SortableOptionRow = ({
	option,
	index,
	syncLabelValue,
	onChange,
	onDelete,
	isSelected,
	onSelect,
	showDescription = false,
}: SortableOptionRowProps) => {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: `option-${index}`,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	const rowClassName = [
		'streamery-forms-options-table-row',
		isSelected && 'streamery-forms-options-table-row-selected',
		isDragging && 'streamery-forms-options-table-row-dragging',
	].filter(Boolean).join(' ');

	return (
		<tr ref={setNodeRef} className={rowClassName} style={style}>
			<td className="streamery-forms-options-table-td-checkbox">
				<CheckboxControl
					checked={isSelected}
					onChange={(checked) => onSelect(index, checked)}
					__nextHasNoMarginBottom={true}
				/>
			</td>
			<td
				className="streamery-forms-options-table-td-move"
				{...attributes}
				{...listeners}
			>
				<BlockIcon icon={GripVertical} clean={true} />
			</td>
			<OptionFields 
				option={option} 
				syncLabelValue={syncLabelValue} 
				onChange={onChange}
				index={index}
				showDescription={showDescription}
			/>
			<td className="streamery-forms-options-table-td-actions">
				<Button
					onClick={() => onDelete(index)}
					icon={<BlockIcon icon={Trash2} clean={true} />}
					isSmall
					variant="tertiary"
					isDestructive
				/>
			</td>
		</tr>
	);
};

interface OptionFieldsProps {
	option: Option;
	syncLabelValue: boolean;
	onChange: (index: number, option: Option) => void;
	index: number;
	showDescription?: boolean;
}

const OptionFields = ({ option, syncLabelValue, onChange, index, showDescription = false }: OptionFieldsProps) => {
	return (
		<>
			<td>
				<TextControl
					value={option.label}
					onChange={label => {
						onChange(index, { ...option, label, value: syncLabelValue ? label : option.value });
					}}
					placeholder={__('label')}
					__next40pxDefaultSize={true}
					__nextHasNoMarginBottom={true}
				/>
			</td>
			<td>
				<TextControl
					value={option.value}
					onChange={value => {
						onChange(index, { ...option, value, label: syncLabelValue ? option.label : value });
					}}
					placeholder={__('value')}
					disabled={syncLabelValue}
					__next40pxDefaultSize={true}
					__nextHasNoMarginBottom={true}
				/>
			</td>
			{showDescription && (
				<td>
					<TextControl
						value={option.description ?? ''}
						onChange={description => {
							onChange(index, { ...option, description });
						}}
						placeholder={__('description', 'Beschreibung')}
						__next40pxDefaultSize={true}
						__nextHasNoMarginBottom={true}
					/>
				</td>
			)}
		</>
	)
}

