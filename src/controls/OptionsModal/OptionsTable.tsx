import { __ } from '../../lib/i18n';
import { CheckboxControl, Button } from '@wordpress/components';
import { type Option } from '../OptionsRepeater';
import { SortableOptionRow } from './SortableOptionRow';
import { NewOptionRow } from './NewOptionRow';
import { Plus } from 'lucide-react';
import BlockIcon from '../../components/block-atoms/BlockIcon';
import './styles.css';
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	DragEndEvent,
} from '@dnd-kit/core';
import {
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface OptionsTableProps {
	options: Option[];
	selectedIndices: Set<number>;
	allSelected: boolean;
	someSelected: boolean;
	newOption: Option;
	syncLabelValue: boolean;
	onDragEnd: (event: DragEndEvent) => void;
	onOptionChange: (index: number, option: Option) => void;
	onDelete: (index: number) => void;
	onSelect: (index: number, selected: boolean) => void;
	onSelectAll: () => void;
	onNewOptionChange: (option: Option) => void;
	onAddNewOption: () => void;
	onBulkAddClick: () => void;
	showDescription?: boolean;
}

export const OptionsTable = ({
	options,
	selectedIndices,
	allSelected,
	someSelected,
	newOption,
	syncLabelValue,
	onDragEnd,
	onOptionChange,
	onDelete,
	onSelect,
	onSelectAll,
	onNewOptionChange,
	onAddNewOption,
	onBulkAddClick,
	showDescription = false,
}: OptionsTableProps) => {
	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	return (
		<div className="streamery-forms-options-table-wrapper">
			<div className="streamery-forms-options-table-actions">
				<Button
					onClick={onBulkAddClick}
					variant="secondary"
					isSmall
					icon={<BlockIcon icon={Plus} clean={true} />}
				>
					{__('addBulkOptions')}
				</Button>
			</div>
			<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
				<SortableContext
					items={options.map((_, i) => `option-${i}`)}
					strategy={verticalListSortingStrategy}
				>
					<div className="streamery-forms-options-table-container">
						<table className="streamery-forms-options-table">
							<thead>
								<tr>
									<th className="streamery-forms-options-table-th-checkbox">
										<CheckboxControl
											checked={allSelected || someSelected}
											onChange={onSelectAll}
											__nextHasNoMarginBottom={true}
										/>
									</th>
									<th className="streamery-forms-options-table-th-move">
										{__('move')}
									</th>
									<th>
										{__('label')}
									</th>
									<th>
										{__('value')}
									</th>
									{showDescription && (
										<th>
											{__('description')}
										</th>
									)}
									<th className="streamery-forms-options-table-th-actions">
										{__('actions')}
									</th>
								</tr>
							</thead>
							<tbody>
								{options.map((option, index) => (
									<SortableOptionRow
										key={`option-${index}`}
										option={option}
										index={index}
										syncLabelValue={syncLabelValue}
										onChange={onOptionChange}
										onDelete={onDelete}
										isSelected={selectedIndices.has(index)}
										onSelect={onSelect}
										showDescription={showDescription}
									/>
								))}
								<NewOptionRow
									newOption={newOption}
									syncLabelValue={syncLabelValue}
									onChange={onNewOptionChange}
									onAdd={onAddNewOption}
									showDescription={showDescription}
								/>
							</tbody>
						</table>
					</div>
				</SortableContext>
			</DndContext>
		</div>
	);
};

