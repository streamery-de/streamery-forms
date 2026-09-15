import { __ } from "@/lib/i18n";
import { useState } from '@wordpress/element';
import { BlockControls } from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton, Modal } from '@wordpress/components';
import { type BlockEditProps } from '@wordpress/blocks';
import { type FormAttributes } from '@/blockTypes/form';
import { type TemplateArray } from '@wordpress/blocks';
import { LayoutTemplate, Settings } from 'lucide-react';
import BlockIcon from '../../components/block-atoms/BlockIcon';
import TemplateSelect from '../../components/block-atoms/TemplateSelect';
import { FormSettingsModal } from '../../components/form-settings/FormSettingsModal';
import { SuccessScreenToolbarButton } from '../../components/form-settings/SuccessScreenToolbarButton';

type FormBlockControlsProps = BlockEditProps<FormAttributes> & {
	hasBlocks?: boolean;
	onReplaceWithTemplate?: (template: TemplateArray) => void;
};

export const FormBlockControls = ({
	attributes,
	setAttributes,
	clientId,
	hasBlocks = false,
	onReplaceWithTemplate,
}: FormBlockControlsProps) => {
	const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);

	const handleTemplateSelect = (template: TemplateArray) => {
		onReplaceWithTemplate?.(template);
		setIsTemplateModalOpen(false);
	};

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					{hasBlocks && (
						<ToolbarButton
							icon={<BlockIcon icon={LayoutTemplate} clean={true} />}
							label={__('changeTemplate')}
							onClick={() => setIsTemplateModalOpen(true)}
						/>
					)}
					<SuccessScreenToolbarButton
						successView={!!attributes.successView}
						onToggle={() => setAttributes({ successView: !attributes.successView })}
					/>
				</ToolbarGroup>
				<ToolbarGroup>
					<ToolbarButton
						icon={<BlockIcon icon={Settings} clean={true} />}
						label={__('formSettings')}
						onClick={() => setIsSettingsOpen(true)}
					/>
				</ToolbarGroup>
			</BlockControls>
			{isSettingsOpen && clientId && (
				// Same component the nested-block toolbar opens -- here it just
				// happens to be the form's own clientId.
				<FormSettingsModal
					formClientId={clientId}
					onClose={() => setIsSettingsOpen(false)}
				/>
			)}
			{isTemplateModalOpen && (
				<Modal
					title={__('changeTemplate')}
					onRequestClose={() => setIsTemplateModalOpen(false)}
					className="streamery-forms-change-template-modal"
					style={{ maxWidth: '720px' }}
				>
					<p className="streamery-forms-change-template-modal__warning">
						{__('templateResetWarning')}
					</p>
					<TemplateSelect onSelect={handleTemplateSelect} />
				</Modal>
			)}
		</>
	);
};
