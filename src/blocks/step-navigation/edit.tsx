import { __ } from '@/lib/i18n';
import {
	useBlockProps,
	RichText,
	BlockControls,
	InspectorControls,
	/** @ts-expect-error */
	JustifyContentControl,
} from '@wordpress/block-editor';
import { ToolbarGroup, PanelBody, TextControl } from '@wordpress/components';
import { type BlockEditProps } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { type StepNavigationAttributes } from '@/blockTypes/step-navigation';
import './editor.css';

export default function Edit(props: BlockEditProps<StepNavigationAttributes>) {
	const { attributes, setAttributes, clientId } = props;

	// Compute step index and total steps by traversing block hierarchy
	const { stepIndex, totalSteps } = useSelect(
		(select: any) => {
			const { getBlockParents, getBlocks, getBlockName } = select('core/block-editor');
			const parents = getBlockParents(clientId);

			// Find the parent step block
			let stepClientId: string | null = null;
			let formClientId: string | null = null;
			for (const parentId of [...parents].reverse()) {
				const name = getBlockName(parentId);
				if (name === 'streamery-forms/step' && !stepClientId) {
					stepClientId = parentId;
				}
				if (name === 'streamery-forms/form') {
					formClientId = parentId;
				}
			}

			if (!formClientId) return { stepIndex: 0, totalSteps: 1 };

			const formBlocks = getBlocks(formClientId);
			const stepBlocks = formBlocks.filter((b: any) => b.name === 'streamery-forms/step');
			const idx = stepClientId
				? stepBlocks.findIndex((b: any) => b.clientId === stepClientId)
				: 0;

			return {
				stepIndex: idx >= 0 ? idx : 0,
				totalSteps: stepBlocks.length || 1,
			};
		},
		[clientId]
	);

	const isFirstStep = stepIndex === 0;
	const isLastStep = stepIndex === totalSteps - 1;

	const justifyMap: Record<string, string> = {
		'left': 'flex-start',
		'center': 'center',
		'right': 'flex-end',
		'space-between': 'space-between',
	};

	const blockProps = useBlockProps({
		className: 'streamery-forms-step-navigation',
		style: {
			justifyContent: justifyMap[attributes.justification] || 'flex-start',
		},
	});

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<JustifyContentControl
						allowedControls={['left', 'center', 'right', 'space-between']}
						value={attributes.justification}
						onChange={(justification: string) => setAttributes({ justification: justification as StepNavigationAttributes['justification'] })}
					/>
				</ToolbarGroup>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={__('stepNavigationButtonLabels', 'Button labels')} initialOpen={true}>
					<TextControl
						label={__('stepNavPrevLabel', 'Previous button')}
						value={attributes.prevLabel}
						onChange={(prevLabel) => setAttributes({ prevLabel })}
						help={__('stepNavPrevLabelHelp', 'Shown on all steps except the first.')}
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					/>
					<TextControl
						label={__('stepNavNextLabel', 'Next button')}
						value={attributes.nextLabel}
						onChange={(nextLabel) => setAttributes({ nextLabel })}
						help={__('stepNavNextLabelHelp', 'Shown when there is a following step.')}
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					/>
					<TextControl
						label={__('stepNavSubmitLabel', 'Submit button')}
						value={attributes.submitLabel}
						onChange={(submitLabel) => setAttributes({ submitLabel })}
						help={__('stepNavSubmitLabelHelp', 'Shown on the last visible step (e.g. when using conditional steps).')}
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				{attributes.showPrev && !isFirstStep && (
					<button type="button" className="streamery-forms-step-prev" onClick={(e) => e.preventDefault()}>
						<RichText
							tagName="span"
							value={attributes.prevLabel}
							onChange={(prevLabel) => setAttributes({ prevLabel })}
							placeholder={__('back')}
						/>
					</button>
				)}
				<button type="button" className={isLastStep ? 'streamery-forms-step-submit' : 'streamery-forms-step-next'} onClick={(e) => e.preventDefault()}>
					<RichText
						tagName="span"
						value={isLastStep ? attributes.submitLabel : attributes.nextLabel}
						onChange={(value) => {
							if (isLastStep) {
								setAttributes({ submitLabel: value });
							} else {
								setAttributes({ nextLabel: value });
							}
						}}
						placeholder={isLastStep ? __('submit') : __('next')}
					/>
				</button>
			</div>
		</>
	);
}
