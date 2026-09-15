/**
 * Toolbar control that switches the parent form between the form canvas
 * and the success screen. Shown on the form block and on every nested
 * field so it stays reachable the same way Form Settings does.
 */
import { ToolbarButton } from '@wordpress/components';
import { MonitorCheck } from 'lucide-react';
import { __ } from '@/lib/i18n';
import BlockIcon from '../block-atoms/BlockIcon';

type Props = {
	successView: boolean;
	onToggle: () => void;
};

export function SuccessScreenToolbarButton({ successView, onToggle }: Props) {
	return (
		<ToolbarButton
			icon={
				<span className="streamery-forms-success-screen-toolbar-button">
					<BlockIcon icon={MonitorCheck} clean={true} />
					{__('successScreen')}
				</span>
			}
			label={successView ? __('successScreenBackToForm') : __('successScreenShow')}
			onClick={onToggle}
			isActive={successView}
		/>
	);
}
