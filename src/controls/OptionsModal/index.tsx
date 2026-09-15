import { useState, useEffect } from '@wordpress/element';
import { createPortal } from 'react-dom';
import { type Option } from '../OptionsRepeater';
import { PresetGrid } from './PresetGrid';
import { BulkActionsBar } from './BulkActionsBar';
import { OptionsTable } from './OptionsTable';
import { ModalHeader } from './ModalHeader';
import { ModalFooter } from './ModalFooter';
import { BulkAddOptions } from './BulkAddOptions';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import './styles.css';

interface OptionsModalProps {
	isOpen: boolean;
	onClose: () => void;
	options: Option[];
	syncLabelValue: boolean;
	onChange: (options: Option[]) => void;
	onSyncLabelValueChange: (syncLabelValue: boolean) => void;
	presets: Array<{
		name: string;
		title: string;
		options: Option[];
	}>;
	showDescription?: boolean;
}

export const OptionsModal = ({
	isOpen,
	onClose,
	options,
	syncLabelValue: initialSyncLabelValue,
	onChange,
	onSyncLabelValueChange,
	presets,
	showDescription = false,
}: OptionsModalProps) => {
	const [localOptions, setLocalOptions] = useState<Option[]>(options);
	const [newOption, setNewOption] = useState<Option>(
		showDescription ? { label: '', value: '', description: '' } : { label: '', value: '' }
	);
	const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
	const [editorElement, setEditorElement] = useState<HTMLElement | null>(null);
	const [syncLabelValue, setSyncLabelValue] = useState<boolean>(initialSyncLabelValue);
	const [isBulkAddOpen, setIsBulkAddOpen] = useState<boolean>(false);

	// Find the #editor element
	useEffect(() => {
		const editor = document.getElementById('editor');
		if (editor) {
			setEditorElement(editor);
		}
	}, []);

	// Sync localOptions when modal opens (but not when options change while open)
	useEffect(() => {
		if (isOpen) {
			setLocalOptions(options);
			setSelectedIndices(new Set());
			setSyncLabelValue(initialSyncLabelValue);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen]);

	if (!isOpen || !editorElement) return null;

	const hasOptions = localOptions.length > 0;
	const allSelected = hasOptions && selectedIndices.size === localOptions.length;
	const someSelected = selectedIndices.size > 0 && selectedIndices.size < localOptions.length;

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			const oldIndex = localOptions.findIndex((_, i) => `option-${i}` === active.id);
			const newIndex = localOptions.findIndex((_, i) => `option-${i}` === over.id);

			if (oldIndex !== -1 && newIndex !== -1) {
				const newOptions = arrayMove(localOptions, oldIndex, newIndex);
				setLocalOptions(newOptions);

				// Update selected indices after reordering
				const newSelectedIndices = new Set<number>();
				selectedIndices.forEach((oldIdx) => {
					if (oldIdx === oldIndex) {
						newSelectedIndices.add(newIndex);
					} else if (oldIdx === newIndex) {
						newSelectedIndices.add(oldIndex);
					} else if (oldIdx < Math.min(oldIndex, newIndex) || oldIdx > Math.max(oldIndex, newIndex)) {
						newSelectedIndices.add(oldIdx);
					} else {
						// Adjust index based on direction
						if (oldIndex < newIndex) {
							newSelectedIndices.add(oldIdx - 1);
						} else {
							newSelectedIndices.add(oldIdx + 1);
						}
					}
				});
				setSelectedIndices(newSelectedIndices);
			}
		}
	};

	const handleOptionChange = (index: number, option: Option) => {
		const newOptions = [...localOptions];
		// If sync is enabled, automatically set value to label
		if (syncLabelValue && option.label !== undefined) {
			option.value = option.label;
		}
		newOptions[index] = option;
		setLocalOptions(newOptions);
	};

	const handleDelete = (index: number) => {
		const newOptions = localOptions.filter((_, i) => i !== index);
		setLocalOptions(newOptions);
		const newSelected = new Set(selectedIndices);
		newSelected.delete(index);
		// Adjust indices after deletion
		const adjustedSelected = new Set<number>();
		newSelected.forEach((idx) => {
			if (idx > index) {
				adjustedSelected.add(idx - 1);
			} else {
				adjustedSelected.add(idx);
			}
		});
		setSelectedIndices(adjustedSelected);
	};

	const handleBulkDelete = () => {
		const sortedIndices = Array.from(selectedIndices).sort((a, b) => b - a);
		let newOptions = [...localOptions];
		sortedIndices.forEach((idx) => {
			newOptions = newOptions.filter((_, i) => i !== idx);
		});
		setLocalOptions(newOptions);
		setSelectedIndices(new Set());
	};

	const handleSelectAll = () => {
		if (allSelected) {
			setSelectedIndices(new Set());
		} else {
			setSelectedIndices(new Set(localOptions.map((_, i) => i)));
		}
	};

	const handleSelect = (index: number, selected: boolean) => {
		const newSelected = new Set(selectedIndices);
		if (selected) {
			newSelected.add(index);
		} else {
			newSelected.delete(index);
		}
		setSelectedIndices(newSelected);
	};

	const handleAddNewOption = () => {
		// If sync is enabled, use label as value
		const optionToAdd = syncLabelValue
			? { ...newOption, value: newOption.label }
			: newOption;
		
		if (optionToAdd.label && optionToAdd.value) {
			const newOptions = [...localOptions, optionToAdd];
			setLocalOptions(newOptions);
			setNewOption(showDescription ? { label: '', value: '', description: '' } : { label: '', value: '' });
		}
	};

	const handleBulkAdd = (bulkOptions: Option[]) => {
		// If sync is enabled, ensure all values match labels
		const processedOptions = syncLabelValue
			? bulkOptions.map(opt => ({ ...opt, value: opt.label }))
			: bulkOptions;
		
		const newOptions = [...localOptions, ...processedOptions];
		setLocalOptions(newOptions);
	};

	const handleNewOptionChange = (option: Option) => {
		// If sync is enabled, automatically set value to label
		if (syncLabelValue && option.label !== undefined) {
			option.value = option.label;
		}
		setNewOption(option);
	};

	const handleSelectPreset = (presetOptions: Option[]) => {
		setLocalOptions(presetOptions);
		onChange(presetOptions);
	};

	const handleStartEmpty = () => {
		const emptyOption = showDescription ? { label: '', value: '', description: '' } : { label: '', value: '' };
		const emptyOptions = [
			{ ...emptyOption },
			{ ...emptyOption },
			{ ...emptyOption },
		];
		setLocalOptions(emptyOptions);
		onChange(emptyOptions);
	};

	const handleSyncChange = (sync: boolean) => {
		setSyncLabelValue(sync);
		onSyncLabelValueChange(sync);
		// If enabling sync, update all existing options to have value = label
		if (sync) {
			const syncedOptions = localOptions.map(opt => ({
				...opt,
				value: opt.label,
			}));
			setLocalOptions(syncedOptions);
		}
	};

	const handleSave = () => {
		onChange(localOptions);
		onClose();
	};

	const modalContent = (
		<div
			className="streamery-forms-options-modal-overlay"
			onClick={(e) => {
				if (e.target === e.currentTarget) {
					onClose();
				}
			}}
		>
			<div
				className="streamery-forms-options-modal-container"
				onClick={(e) => e.stopPropagation()}
			>
				<ModalHeader
					onClose={onClose}
					syncLabelValue={syncLabelValue}
					onSyncChange={handleSyncChange}
				/>

				{/* Content */}
				<div className="streamery-forms-options-modal-content">
					{!hasOptions ? (
						<PresetGrid
							presets={presets}
							onSelectPreset={handleSelectPreset}
							onStartEmpty={handleStartEmpty}
							onBulkAddClick={() => setIsBulkAddOpen(true)}
						/>
					) : (
						<div className="streamery-forms-options-modal-content-wrapper">
							{(someSelected || allSelected) && (
								<BulkActionsBar
									selectedCount={selectedIndices.size}
									onDelete={handleBulkDelete}
								/>
							)}

							<OptionsTable
								options={localOptions}
								selectedIndices={selectedIndices}
								allSelected={allSelected}
								someSelected={someSelected}
								newOption={newOption}
								syncLabelValue={syncLabelValue}
								onDragEnd={handleDragEnd}
								onOptionChange={handleOptionChange}
								onDelete={handleDelete}
								onSelect={handleSelect}
								onSelectAll={handleSelectAll}
								onNewOptionChange={handleNewOptionChange}
								onAddNewOption={handleAddNewOption}
								onBulkAddClick={() => setIsBulkAddOpen(true)}
								showDescription={showDescription}
							/>
						</div>
					)}
				</div>

				<ModalFooter hasOptions={hasOptions} onClose={onClose} onSave={handleSave} />
			</div>
			<BulkAddOptions
				isOpen={isBulkAddOpen}
				onClose={() => setIsBulkAddOpen(false)}
				onAdd={handleBulkAdd}
				syncLabelValue={syncLabelValue}
			/>
		</div>
	);

	return createPortal(modalContent, editorElement);
};

