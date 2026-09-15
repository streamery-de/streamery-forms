/**
 * Field mapping editor for the webhook provider.
 *
 * Maps this form's fields onto payload keys. Dot paths in the key produce a
 * nested payload (contact.email -> { contact: { email: ... } }); see
 * Providers\Webhook::apply_field_map().
 */
import { Button, SelectControl, TextControl } from '@wordpress/components';
import { __ } from '@/lib/i18n';
import { type FormFieldOption } from '@/hooks/useFormFieldList';

export type FieldMapRule = { field: string; key: string };

type Props = {
	fields: FormFieldOption[];
	value: FieldMapRule[];
	onChange: (value: FieldMapRule[]) => void;
};

export function FieldMapEditor({ fields, value, onChange }: Props) {
	const rules = Array.isArray(value) ? value : [];

	const update = (index: number, patch: Partial<FieldMapRule>) => {
		const next = rules.map((rule, i) => (i === index ? { ...rule, ...patch } : rule));
		onChange(next);
	};

	const remove = (index: number) => {
		onChange(rules.filter((_, i) => i !== index));
	};

	const add = () => {
		onChange([...rules, { field: fields[0]?.name ?? '', key: '' }]);
	};

	return (
		<div style={{ marginTop: 12 }}>
			<strong style={{ display: 'block', marginBottom: 4 }}>
				{__('fieldMapping', 'Field mapping')}
			</strong>
			<p className="streamery-forms-form-settings__section-description">
				{__(
					'fieldMappingHelp',
					'Leave empty to send all fields unchanged. Use dot paths (contact.email) for nested payloads.'
				)}
			</p>

			{rules.map((rule, index) => (
				<div key={index} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 8 }}>
					<SelectControl
						label={__('formField', 'Form field')}
						value={rule.field}
						options={fields.map((f) => ({ label: f.label || f.name, value: f.name }))}
						onChange={(field) => update(index, { field })}
						__next40pxDefaultSize={true}
						__nextHasNoMarginBottom={true}
					/>
					<TextControl
						label={__('payloadKey', 'Payload key')}
						value={rule.key}
						onChange={(key) => update(index, { key })}
						placeholder="contact.email"
						__next40pxDefaultSize={true}
						__nextHasNoMarginBottom={true}
					/>
					<Button variant="tertiary" isDestructive onClick={() => remove(index)}>
						{__('remove', 'Remove')}
					</Button>
				</div>
			))}

			<Button variant="secondary" onClick={add} disabled={fields.length === 0}>
				{__('addMapping', 'Add mapping')}
			</Button>
		</div>
	);
}
