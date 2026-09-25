import { CheckboxControl, SelectControl } from '@wordpress/components';
import { __ } from '@/lib/i18n';

type DefaultOptionControlProps = {
	options: Array<{ label: string; value: string }>;
	value: string;
	onChange: (value: string) => void;
};

/**
 * Picks which option starts out selected/checked. The first entry, "No
 * default", stores an empty defaultValue. Options without a value are left
 * out, as they could not be told apart from "No default".
 */
export const DefaultOptionControl = ({ options, value, onChange }: DefaultOptionControlProps) => {
	const choices = options.filter((option) => option.value !== '');
	// A default whose option was since renamed or removed no longer matches
	// any option, so nothing is preselected and the control shows "No default".
	const current = choices.some((option) => option.value === value) ? value : '';

	return (
		<SelectControl
			label={__('defaultValue', 'Default value')}
			value={current}
			options={[
				{ value: '', label: __('noDefaultValue', 'No default') },
				...choices.map((option) => ({
					value: option.value,
					label: option.label || option.value,
				})),
			]}
			onChange={onChange}
			__next40pxDefaultSize={true}
			__nextHasNoMarginBottom={true}
		/>
	);
};

type DefaultOptionsChecklistProps = DefaultOptionControlProps;

/**
 * Checkbox variant: several options can start out checked. The values are
 * stored comma-separated in defaultValue, which is how save() reads them.
 */
export const DefaultOptionsChecklist = ({ options, value, onChange }: DefaultOptionsChecklistProps) => {
	const choices = options.filter((option) => option.value !== '');
	const selected = value ? value.split(',').map((v) => v.trim()) : [];

	const toggle = (optionValue: string, checked: boolean) => {
		// Keep the options' order and drop values whose option no longer exists.
		const next = choices
			.map((option) => option.value)
			.filter((v) => (v === optionValue ? checked : selected.includes(v)));
		onChange(next.join(','));
	};

	if (choices.length === 0) {
		return null;
	}

	return (
		<fieldset
			className="streamery-forms-default-options"
			style={{ border: 0, padding: 0, margin: '0 0 16px', minWidth: 0 }}
		>
			<legend className="components-base-control__label" style={{ padding: 0, marginBottom: 8 }}>
				{__('defaultValue', 'Default value')}
			</legend>
			{choices.map((option, index) => (
				<CheckboxControl
					key={index}
					label={option.label || option.value}
					checked={selected.includes(option.value)}
					onChange={(checked) => toggle(option.value, checked)}
					__nextHasNoMarginBottom={true}
				/>
			))}
		</fieldset>
	);
};
