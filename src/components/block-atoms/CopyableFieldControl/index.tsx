import { BaseControl, TextControl, ToggleControl } from '@wordpress/components';
import { CopyableTextControl } from '../CopyableTextControl';
import './styles.css';

type CopyableFieldControlProps = {
	label: string;
	value: string;
	onChange: (value: string) => void;
	useCustom: boolean;
	onUseCustomChange: (useCustom: boolean) => void;
	customToggleLabel?: string;
};

export const CopyableFieldControl = ({
	label,
	value,
	onChange,
	useCustom,
	onUseCustomChange,
	customToggleLabel = 'Use custom name',
}: CopyableFieldControlProps) => {
	return (
		<BaseControl label={label} __nextHasNoMarginBottom={true}>
			{useCustom ? (
				<TextControl
					value={value}
					onChange={onChange}
					__next40pxDefaultSize={true}
					__nextHasNoMarginBottom={true}
				/>
			) : (
				<CopyableTextControl value={value} label={label} />
			)}
			<div className="streamery-forms-copyable-field-control__toggle-wrapper">
				<div className="streamery-forms-copyable-field-control__toggle streamery-forms-custom-name-toggle">
					<ToggleControl
						label={customToggleLabel}
						checked={useCustom}
						onChange={onUseCustomChange}
						__nextHasNoMarginBottom={true}
					/>
				</div>
			</div>
		</BaseControl>
	);
};

