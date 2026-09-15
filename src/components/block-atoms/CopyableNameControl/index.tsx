import { BaseControl, TextControl, ToggleControl } from '@wordpress/components';
import { CopyableTextControl } from '../CopyableTextControl';
import './styles.css';

type CopyableNameControlProps = {
	label: string;
	value: string;
	onChange: (value: string) => void;
	useCustomName: boolean;
	onUseCustomNameChange: (useCustomName: boolean) => void;
};

export const CopyableNameControl = ({
	label,
	value,
	onChange,
	useCustomName,
	onUseCustomNameChange,
}: CopyableNameControlProps) => {
	return (
		<BaseControl label={label} __nextHasNoMarginBottom={true}>
			{useCustomName ? (
				<TextControl
					value={value}
					onChange={onChange}
					__next40pxDefaultSize={true}
					__nextHasNoMarginBottom={true}
				/>
			) : (
				<>
					<CopyableTextControl value={value} label={label} />
					<div className="streamery-forms-copyable-name-control__toggle-wrapper">
						<div className="streamery-forms-copyable-name-control__toggle streamery-forms-custom-name-toggle">
							<ToggleControl
								label="Use custom name"
								checked={useCustomName}
								onChange={onUseCustomNameChange}
								__nextHasNoMarginBottom={true}
							/>
						</div>
					</div>
				</>
			)}
		</BaseControl>
	);
};

