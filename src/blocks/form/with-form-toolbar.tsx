/**
 * Higher-order component that injects Streamery Forms' form-level toolbar controls
 * into any block nested inside a form, at any depth. Registered via
 * addFilter('editor.BlockEdit').
 *
 * There is deliberately ONE BlockControls here with two ToolbarGroups (steps,
 * success screen + form settings) rather than two competing HOCs -- the
 * parent-form lookup is identical for both, and two separate BlockControls
 * would fight over toolbar placement.
 */
import { __ } from '@/lib/i18n';
import { BlockControls } from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';
import { Plus, Settings } from 'lucide-react';
import BlockIcon from '../../components/block-atoms/BlockIcon';
import { FormSettingsModal } from '../../components/form-settings/FormSettingsModal';
import { SuccessScreenToolbarButton } from '../../components/form-settings/SuccessScreenToolbarButton';
import { findFormClientId, getFormStepBlocks } from '../../lib/form-steps';

const withFormToolbar = createHigherOrderComponent((BlockEdit: any) => {
	return (props: any) => {
		const { clientId } = props;

		// NOTE: every hook below must run unconditionally and before any early
		// return. Previously useDispatch sat *after* the `if (!stepToolbarData)`
		// return, so inserting the first step into a form (null -> data) changed
		// the hook order between renders and React threw
		// "rendered more hooks than during the previous render".
		const [isSettingsOpen, setIsSettingsOpen] = useState(false);

		const formData = useSelect(
			(select: any) => {
				const blockEditor = select('core/block-editor');
				const { getBlockName, getBlockAttributes, getBlockRootClientId, getBlockIndex } = blockEditor;

				// The form block renders its own toolbar (see block-controls.tsx).
				if (getBlockName(clientId) === 'streamery-forms/form') {
					return null;
				}

				const formClientId = findFormClientId(blockEditor, clientId);
				if (!formClientId) return null;

				// Steps may be nested (e.g. one column of the form), not just direct children.
				const stepBlocks = getFormStepBlocks(blockEditor, formClientId);
				const formAttrs = getBlockAttributes(formClientId);
				const lastStep = stepBlocks[stepBlocks.length - 1];

				return {
					formClientId,
					activeStep: formAttrs?.activeStep ?? 0,
					successView: !!formAttrs?.successView,
					// A new step goes right after the last one, in the same container.
					newStepRootClientId: lastStep ? getBlockRootClientId(lastStep.clientId) : formClientId,
					newStepIndex: lastStep ? getBlockIndex(lastStep.clientId) + 1 : undefined,
					steps: stepBlocks.map((b: any, i: number) => ({
						clientId: b.clientId,
						title: b.attributes.title || `Step ${i + 1}`,
						index: i,
					})),
				};
			},
			[clientId]
		);

		const { updateBlockAttributes, insertBlock, selectBlock } = useDispatch('core/block-editor');

		if (!formData) {
			return <BlockEdit { ...props } />;
		}

		const { formClientId, activeStep, successView, steps, newStepRootClientId, newStepIndex } = formData;

		const handleSwitchStep = (step: { clientId: string; index: number }) => {
			updateBlockAttributes(formClientId, { activeStep: step.index });
			// Select the step block so focus moves there
			// (prevents the current step's useEffect from overriding activeStep)
			selectBlock(step.clientId);
		};

		const handleAddStep = () => {
			const newBlock = createBlock('streamery-forms/step', {
				title: `Step ${steps.length + 1}`,
			});
			insertBlock(newBlock, newStepIndex, newStepRootClientId);
			updateBlockAttributes(formClientId, { activeStep: steps.length });
		};

		return (
			<>
				<BlockControls>
					{steps.length > 0 && (
						<ToolbarGroup>
							{steps.map((step: { clientId: string; title: string; index: number }) => (
								<ToolbarButton
									key={step.clientId}
									icon={<span style={{
										fontSize: '13px',
										whiteSpace: 'nowrap',
									}}>
										{step.index + 1}. {step.title}
									</span>}
									label={`${__('step')} ${step.index + 1}: ${step.title}`}
									onClick={() => handleSwitchStep(step)}
									isActive={activeStep === step.index}
									style={{ paddingInline: '0.5rem' }}
								/>
							))}
							<ToolbarButton
								icon={<BlockIcon icon={Plus} clean={true} />}
								label={__('addStep')}
								onClick={handleAddStep}
							/>
						</ToolbarGroup>
					)}
					<ToolbarGroup>
						<SuccessScreenToolbarButton
							successView={successView}
							onToggle={() =>
								updateBlockAttributes(formClientId, { successView: !successView })
							}
						/>
						<ToolbarButton
							icon={<BlockIcon icon={Settings} clean={true} />}
							label={__('formSettings')}
							onClick={() => setIsSettingsOpen(true)}
						/>
					</ToolbarGroup>
				</BlockControls>

				{isSettingsOpen && (
					// The modal edits the *parent form*, not this inner block.
					<FormSettingsModal
						formClientId={formClientId}
						onClose={() => setIsSettingsOpen(false)}
					/>
				)}

				<BlockEdit { ...props } />
			</>
		);
	};
}, 'withFormToolbar');

export default withFormToolbar;
