/**
 * Initialize noUiSlider on all .streamery-forms-slider elements and sync values to hidden inputs for form submission.
 * @see https://refreshless.com/nouislider/
 */
import noUiSlider from 'nouislider';

interface SliderOptions {
	start: number | number[];
	range: { min: number; max: number };
	step: number;
	connect: boolean | 'lower' | 'upper';
	orientation?: 'horizontal' | 'vertical';
	direction?: 'ltr' | 'rtl';
	tooltips?: boolean | object | object[];
	margin?: number;
	limit?: number;
	padding?: number | [number, number];
	animate?: boolean;
	animationDuration?: number;
}

/** Tooltip formatter: no decimals when step is integer, otherwise match step decimals. */
function tooltipFormatter(step: number): { to: (value: number) => string } {
	const decimals =
		step >= 1 || Number.isInteger(step)
			? 0
			: (step.toString().split('.')[1]?.length ?? 0);
	return {
		to: (value: number) =>
			decimals === 0 ? String(Math.round(value)) : value.toFixed(decimals),
	};
}

document.addEventListener('DOMContentLoaded', () => {
	const fields = document.querySelectorAll<HTMLElement>('.streamery-forms-field[data-slider-min]');
	fields.forEach((field) => {
		const wrapper = field.querySelector<HTMLElement>('.streamery-forms-slider-wrapper');
		const sliderEl = field.querySelector<HTMLElement>('.streamery-forms-slider');
		if (!wrapper || !sliderEl) return;

		const range = field.getAttribute('data-slider-range') === 'true';
		const min = Number(field.getAttribute('data-slider-min')) || 0;
		const max = Number(field.getAttribute('data-slider-max')) || 100;
		const step = Number(field.getAttribute('data-slider-step')) || 1;
		const startAttr = field.getAttribute('data-slider-start');
		const start: number[] = startAttr ? JSON.parse(startAttr) : range ? [min, max] : [min];
		const orientation = (field.getAttribute('data-slider-orientation') || 'horizontal') as 'horizontal' | 'vertical';
		const direction = (field.getAttribute('data-slider-direction') || 'ltr') as 'ltr' | 'rtl';
		const tooltips = field.getAttribute('data-slider-tooltips') === 'true';
		const connectOpt = field.getAttribute('data-slider-connect');
		const connect: boolean | 'lower' = range ? connectOpt !== 'false' : 'lower';
		const marginAttr = field.getAttribute('data-slider-margin');
		const margin = marginAttr ? Number(marginAttr) : undefined;
		const limitAttr = field.getAttribute('data-slider-limit');
		const limit = limitAttr ? Number(limitAttr) : undefined;
		const paddingAttr = field.getAttribute('data-slider-padding');
		let padding: number | [number, number] | undefined;
		if (paddingAttr) {
			try {
				const parsed = JSON.parse(paddingAttr);
				padding = Array.isArray(parsed) ? (parsed as [number, number]) : Number(parsed);
			} catch {
				// ignore
			}
		}
		const animate = field.getAttribute('data-slider-animate') !== 'false';
		const animationDuration = Number(field.getAttribute('data-slider-animation-duration')) || 300;

		const formatter = tooltipFormatter(step);
		const tooltipsOption: SliderOptions['tooltips'] = tooltips
			? range
				? [formatter, formatter]
				: formatter
			: false;

		const options: SliderOptions = {
			start,
			range: { min, max },
			step,
			connect,
			orientation,
			direction,
			tooltips: tooltipsOption,
			animate,
			animationDuration,
		};
		if (margin !== undefined && margin > 0) options.margin = margin;
		if (limit !== undefined && limit > 0) options.limit = limit;
		if (padding !== undefined) options.padding = padding;

		if (orientation === 'vertical') {
			sliderEl.style.height = '200px';
			sliderEl.style.margin = '0 auto';
		}

		noUiSlider.create(sliderEl, options as Parameters<typeof noUiSlider.create>[1]);

		const hiddenMin = wrapper.querySelector<HTMLInputElement>('.streamery-forms-slider-hidden-min');
		const hiddenMax = wrapper.querySelector<HTMLInputElement>('.streamery-forms-slider-hidden-max');
		const hiddenSingle = wrapper.querySelector<HTMLInputElement>('.streamery-forms-slider-hidden');

		const api = sliderEl.noUiSlider;
		api.on('update', (values: string[]) => {
			if (range && hiddenMin && hiddenMax) {
				hiddenMin.value = values[0];
				hiddenMax.value = values[1];
			} else if (!range && hiddenSingle) {
				hiddenSingle.value = values[0];
			}
		});
	});
});
