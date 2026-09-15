import { type BlockEditProps } from '@wordpress/blocks';
import { type SliderAttributes } from '@/blockTypes/slider';
import { useEffect, useRef } from '@wordpress/element';
import noUiSlider from 'nouislider';
import './editor.css';
import { useUniqueID } from '../../lib/use-unique-id';
import { useNameFromLabel } from '../../lib/use-name-from-label';
import { SliderInspectorControls } from './inspector-controls';
import { FieldWrapper } from '../../components/block-atoms/FieldWrapper';

export default function Edit(props: BlockEditProps<SliderAttributes>) {
	const { attributes, setAttributes, clientId } = props;
	const sliderRef = useRef<HTMLDivElement>(null);

	useUniqueID(attributes.id, clientId, setAttributes);

	useNameFromLabel(
		attributes.label,
		attributes.name,
		(name) => setAttributes({ name }),
		attributes.useCustomName || false
	);

	const min = attributes.min ?? 0;
	const max = attributes.max ?? 100;
	const step = attributes.step ?? 1;
	const range = attributes.range || false;
	const defaultValue = attributes.defaultValue
		? Number(attributes.defaultValue)
		: min;
	const defaultValueStart = attributes.defaultValueStart ?? min;
	const defaultValueEnd = attributes.defaultValueEnd ?? max;
	const orientation = attributes.orientation ?? 'horizontal';
	const direction = attributes.direction ?? 'ltr';
	const tooltips = attributes.tooltips ?? false;
	const connect = attributes.connect ?? true;
	const margin = attributes.margin ?? 0;
	const limit = attributes.limit ?? 0;
	const paddingStart = attributes.paddingStart ?? 0;
	const paddingEnd = attributes.paddingEnd ?? 0;
	const animate = attributes.animate ?? true;
	const animationDuration = attributes.animationDuration ?? 300;

	useEffect(() => {
		const el = sliderRef.current;
		if (!el) return;

		const start = range ? [defaultValueStart, defaultValueEnd] : [defaultValue];
		const tooltipFormatter = {
			to: (value: number) =>
				step >= 1 || Number.isInteger(step)
					? String(Math.round(value))
					: value.toFixed(step.toString().split('.')[1]?.length ?? 0),
		};
		const tooltipsOption = tooltips
			? range
				? [tooltipFormatter, tooltipFormatter]
				: tooltipFormatter
			: false;
		const options: Record<string, unknown> = {
			start,
			range: { min, max },
			step,
			connect: range ? connect : 'lower',
			orientation,
			direction,
			tooltips: tooltipsOption,
			animate,
			animationDuration,
		};
		if (margin > 0) options.margin = margin;
		if (limit > 0) options.limit = limit;
		if (paddingStart > 0 || paddingEnd > 0) {
			options.padding =
				paddingStart > 0 && paddingEnd > 0
					? [paddingStart, paddingEnd]
					: paddingStart || paddingEnd;
		}

		noUiSlider.create(el, options as Parameters<typeof noUiSlider.create>[1]);

		return () => {
			if (el.noUiSlider) {
				el.noUiSlider.destroy();
			}
		};
	}, [
		min,
		max,
		step,
		range,
		defaultValueStart,
		defaultValueEnd,
		defaultValue,
		orientation,
		direction,
		tooltips,
		connect,
		margin,
		limit,
		paddingStart,
		paddingEnd,
		animate,
		animationDuration,
	]);

	return (
		<>
			<SliderInspectorControls {...props} />
			<FieldWrapper
				label={attributes.label}
				onLabelChange={(label) => setAttributes({ label })}
				help={attributes.help}
				onHelpChange={(help) => setAttributes({ help })}
				attributes={attributes}
			>
				<div className="streamery-forms-slider-wrapper">
					<div
						ref={sliderRef}
						className="streamery-forms-slider streamery-forms-slider--editor"
						style={
							orientation === 'vertical'
								? { height: '200px', margin: '0 auto' }
								: undefined
						}
					/>
				</div>
			</FieldWrapper>
		</>
	);
}
