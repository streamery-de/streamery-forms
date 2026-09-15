import { __ } from '@/lib/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';
import { type BlockEditProps } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { type ProgressAttributes } from '@/blockTypes/progress';
import './editor.css';

export default function Edit(props: BlockEditProps<ProgressAttributes>) {
	const { attributes, setAttributes, clientId, context } = props;

	const activeStep = (context as any)?.['streamery-forms/activeStep'] ?? 0;

	// Get step blocks from the parent form
	const steps = useSelect(
		(select: any) => {
			const { getBlockParents, getBlocks } = select('core/block-editor');
			const parents = getBlockParents(clientId);
			const formId = parents[parents.length - 1];
			if (!formId) return [];
			const formBlocks = getBlocks(formId);
			return formBlocks
				.filter((b: any) => b.name === 'streamery-forms/step')
				.map((b: any, index: number) => ({
					title: b.attributes.title || `Step ${index + 1}`,
					index,
				}));
		},
		[clientId]
	);

	const totalSteps = steps.length || 1;
	const progressPercent = totalSteps > 1
		? Math.round(((activeStep) / (totalSteps - 1)) * 100)
		: 100;

	const blockProps = useBlockProps({
		className: `streamery-forms-progress streamery-forms-progress--${attributes.variant}`,
	});

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('progressSettings')}>
					<SelectControl
						label={__('progressVariant')}
						value={attributes.variant}
						onChange={(variant: string) => setAttributes({ variant: variant as 'bar' | 'bubbles' })}
						options={[
							{ label: __('progressBubbles'), value: 'bubbles' },
							{ label: __('progressBar'), value: 'bar' },
						]}
						__next40pxDefaultSize={true}
						__nextHasNoMarginBottom={true}
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				{attributes.variant === 'bar' ? (
					<div className="streamery-forms-progress-bar">
						<div className="streamery-forms-progress-bar__track">
							<div
								className="streamery-forms-progress-bar__fill"
								style={{ width: `${progressPercent}%` }}
							/>
						</div>
						<div className="streamery-forms-progress-bar__label">
							{progressPercent}%
						</div>
					</div>
				) : (
					<div className="streamery-forms-progress-bubbles">
						{steps.map((step: { title: string; index: number }) => (
							<div
								key={step.index}
								className={`streamery-forms-progress-bubble ${
									step.index < activeStep
										? 'streamery-forms-progress-bubble--completed'
										: step.index === activeStep
											? 'streamery-forms-progress-bubble--active'
											: ''
								}`}
							>
								<div className="streamery-forms-progress-bubble__circle">
									{step.index + 1}
								</div>
								<div className="streamery-forms-progress-bubble__title">
									{step.title}
								</div>
								{step.index < totalSteps - 1 && (
									<div className={`streamery-forms-progress-bubble__line ${
										step.index < activeStep ? 'streamery-forms-progress-bubble__line--completed' : ''
									}`} />
								)}
							</div>
						))}
					</div>
				)}
			</div>
		</>
	);
}
