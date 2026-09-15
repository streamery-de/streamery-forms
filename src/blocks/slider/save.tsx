import { SliderAttributes } from '@/blockTypes/slider';
import { hasConditionalShowToOutput } from '@/blockTypes/conditionalLogic';
import { useBlockProps } from '@wordpress/block-editor';
import { type BlockSaveProps } from '@wordpress/blocks';
import { getFieldClasses } from '../../lib/utils';

export default function save(props: BlockSaveProps<SliderAttributes>) {
	const className = getFieldClasses(props.attributes);
	const {
		min = 0,
		max = 100,
		step = 1,
		range = false,
		name,
		id,
		required,
		label,
		help,
		conditionalShow,
		defaultValue,
		defaultValueStart,
		defaultValueEnd,
		orientation = 'horizontal',
		direction = 'ltr',
		tooltips = false,
		connect = true,
		margin = 0,
		limit = 0,
		paddingStart = 0,
		paddingEnd = 0,
		animate = true,
		animationDuration = 300,
	} = props.attributes;

	const singleValue = defaultValue !== '' ? Number(defaultValue) : min;
	const startVal = defaultValueStart ?? min;
	const endVal = defaultValueEnd ?? max;
	const startJson = range ? JSON.stringify([startVal, endVal]) : JSON.stringify([singleValue]);

	return (
		<div
			{...useBlockProps.save({
				className,
				...(hasConditionalShowToOutput(conditionalShow) && {
					'data-conditional-show': JSON.stringify(conditionalShow),
				}),
				'data-slider-range': range ? 'true' : 'false',
				'data-slider-min': String(min),
				'data-slider-max': String(max),
				'data-slider-step': String(step),
				'data-slider-start': startJson,
				'data-slider-orientation': orientation,
				'data-slider-direction': direction,
				'data-slider-tooltips': tooltips ? 'true' : 'false',
				'data-slider-connect': range ? (connect ? 'true' : 'false') : undefined,
				...(margin > 0 && { 'data-slider-margin': String(margin) }),
				...(limit > 0 && { 'data-slider-limit': String(limit) }),
				...((paddingStart > 0 || paddingEnd > 0) && {
					'data-slider-padding': JSON.stringify(
						paddingStart > 0 && paddingEnd > 0 ? [paddingStart, paddingEnd] : paddingStart || paddingEnd
					),
				}),
				'data-slider-animate': animate ? 'true' : 'false',
				'data-slider-animation-duration': String(animationDuration),
				'data-slider-name': name,
			})}
		>
			{label && (
				<label htmlFor={id} className="streamery-forms-field__label">
					{label}
				</label>
			)}
			<div className="streamery-forms-slider-wrapper">
				{range ? (
					<>
						<input
							type="hidden"
							name={`${name}_min`}
							defaultValue={String(startVal)}
							className="streamery-forms-slider-hidden-min"
						/>
						<input
							type="hidden"
							name={`${name}_max`}
							defaultValue={String(endVal)}
							className="streamery-forms-slider-hidden-max"
						/>
						<div className="streamery-forms-slider" aria-hidden="true" />
					</>
				) : (
					<>
						<input
							type="hidden"
							name={name}
							defaultValue={String(singleValue)}
							className="streamery-forms-slider-hidden"
							required={required}
						/>
						<div className="streamery-forms-slider" aria-hidden="true" />
					</>
				)}
			</div>
			{help && <p className="streamery-forms-field__help" id={`${id}-help`}>{help}</p>}
		</div>
	);
}
