import { __ } from '@/lib/i18n';
import {
	InnerBlocks,
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
} from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';
import { type BlockEditProps } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { type StepAttributes } from '@/blockTypes/step';
import { ConditionalLogicControls } from '../../components/block-atoms/ConditionalLogicControls';
import { allowedBlocks, prioritizedInserterBlocks } from './allowedBlocks';
import { useUniqueID } from '../../lib/use-unique-id';
import './editor.css';

export default function Edit(props: BlockEditProps<StepAttributes>) {
	const { attributes, setAttributes, clientId, context, isSelected } = props;

	// Automatically generate and set unique step ID
	useUniqueID(
		attributes.stepId,
		clientId,
		(attrs: { id: string }) => setAttributes({ stepId: attrs.id }),
		'streamery-forms-step'
	);

	// Get the active step from form context
	const activeStep = (context as any)?.['streamery-forms/activeStep'] ?? 0;

	const { updateBlockAttributes } = useDispatch('core/block-editor');

	// Compute this step's index and check if any descendant is selected
	const { stepIndex, hasSelectedDescendant, formClientId } = useSelect(
		(select: any) => {
			const { getBlockParents, getBlocks, hasSelectedInnerBlock, getBlockName } = select('core/block-editor');
			const parents = getBlockParents(clientId);
			const parentId = parents[parents.length - 1];

			// Find the form block
			let formId: string | null = null;
			for (const pid of [...parents].reverse()) {
				const name = getBlockName(pid);
				if (name === 'streamery-forms/form') {
					formId = pid;
					break;
				}
			}

			if (!parentId) return { stepIndex: 0, hasSelectedDescendant: false, formClientId: null };

			const siblings = getBlocks(parentId);
			const stepBlocks = siblings.filter((b: any) => b.name === 'streamery-forms/step');
			const idx = stepBlocks.findIndex((b: any) => b.clientId === clientId);

			return {
				stepIndex: idx >= 0 ? idx : 0,
				hasSelectedDescendant: hasSelectedInnerBlock(clientId, true),
				formClientId: formId,
			};
		},
		[clientId]
	);

	// Sync active step when this step or any of its descendants get selected
	useEffect(() => {
		if ((isSelected || hasSelectedDescendant) && formClientId && stepIndex !== activeStep) {
			updateBlockAttributes(formClientId, { activeStep: stepIndex });
		}
	}, [isSelected, hasSelectedDescendant, stepIndex, activeStep, formClientId, updateBlockAttributes]);

	const isActive = stepIndex === activeStep;

	const blockProps = useBlockProps({
		className: `streamery-forms-step ${isActive ? 'streamery-forms-step--active' : 'streamery-forms-step--hidden'}`,
		style: isActive ? {} : { display: 'none' },
		'data-step-index': stepIndex,
	});

	const innerBlockProps = useInnerBlocksProps({}, {
		allowedBlocks: allowedBlocks,
		prioritizedInserterBlocks: prioritizedInserterBlocks,
		renderAppender: InnerBlocks.ButtonBlockAppender,
		templateLock: false,
		template: [
			['streamery-forms/input', { type: 'text' }],
			['streamery-forms/step-navigation', {}],
		],
	});

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('step')}>
					<TextControl
						label={__('stepTitle')}
						value={attributes.title}
						onChange={(title) => setAttributes({ title })}
						__next40pxDefaultSize={true}
						__nextHasNoMarginBottom={true}
					/>
				</PanelBody>
			</InspectorControls>
			{clientId && (
				<ConditionalLogicControls
					clientId={clientId}
					conditionalShow={attributes.conditionalShow}
					setAttributes={(attrs) => setAttributes(attrs)}
				/>
			)}

			<div { ...blockProps }>
				<div { ...innerBlockProps } />
			</div>
		</>
	);
}
