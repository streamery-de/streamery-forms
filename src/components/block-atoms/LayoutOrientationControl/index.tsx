import { BaseControl, ButtonGroup, Button } from '@wordpress/components';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { __ } from '@/lib/i18n';

type Layout = 'horizontal' | 'vertical';

type LayoutOrientationControlProps = {
	value: Layout;
	onChange: (layout: Layout) => void;
	label?: string;
};

/**
 * WordPress-style layout orientation control: horizontal (→) / vertical (↓) as icon button group.
 */
export function LayoutOrientationControl({
	value,
	onChange,
	label = __('layout'),
}: LayoutOrientationControlProps) {
	return (
		<BaseControl label={label} className="streamery-forms-layout-orientation-control">
			<ButtonGroup className="streamery-forms-layout-button-group">
				<Button
					isPressed={value === 'horizontal'}
					onClick={() => onChange('horizontal')}
					icon={<ArrowRight size={18} />}
					label={__('horizontal')}
					showTooltip
					className="streamery-forms-layout-btn"
				/>
				<Button
					isPressed={value === 'vertical'}
					onClick={() => onChange('vertical')}
					icon={<ArrowDown size={18} />}
					label={__('vertical')}
					showTooltip
					className="streamery-forms-layout-btn"
				/>
			</ButtonGroup>
		</BaseControl>
	);
}
