import { __ } from '../../lib/i18n';
import { Button } from '@wordpress/components';
import { Trash2 } from 'lucide-react';
import BlockIcon from '../../components/block-atoms/BlockIcon';
import './styles.css';

interface BulkActionsBarProps {
	selectedCount: number;
	onDelete: () => void;
}

export const BulkActionsBar = ({ selectedCount, onDelete }: BulkActionsBarProps) => {
	return (
		<div className="streamery-forms-options-bulk-actions">
			<span>
				{selectedCount} {__('selected')}
			</span>
			<Button
				onClick={onDelete}
				variant="secondary"
				isSmall
				isDestructive
				icon={<BlockIcon icon={Trash2} clean={true} />}
			>
				{__('deleteSelected')}
			</Button>
		</div>
	);
};

