import { __ } from '../lib/i18n';
import { PanelRow, Button } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { Settings } from 'lucide-react';
import BlockIcon from '../components/block-atoms/BlockIcon';
import { OptionsModal } from './OptionsModal';

export type Option = {
	label: string;
	value: string;
	description?: string;
	imageId?: number;
	imageUrl?: string;
	imageAlt?: string;
};

interface OptionsRepeaterProps {
	options: Option[];
	syncLabelValue: boolean;
	onChange: (options: Option[]) => void;
	onSyncLabelValueChange: (syncLabelValue: boolean) => void;
	presets?: Array<{
		name: string;
		title: string;
		options: Option[];
	}>;
	/** Show description field for each option (checkbox/radio only) */
	showDescription?: boolean;
	/** Show image picker for each option (checkbox/radio only) */
	showImage?: boolean;
}

export const OptionsRepeater = ({
	options,
	syncLabelValue,
	onChange,
	onSyncLabelValueChange,
	presets = [],
	showDescription = false,
	showImage = false,
}: OptionsRepeaterProps) => {
	const [isModalOpen, setIsModalOpen] = useState(false);

	return (
		<>
			<PanelRow>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
					<span style={{ fontSize: '13px', color: '#646970' }}>
						{options.length} {__('Optionen')}
					</span>
					<Button
						onClick={() => setIsModalOpen(true)}
						variant="primary"
						isSmall
						icon={<BlockIcon icon={Settings} clean={true} />}
					>
						{__('manageOptions')}
					</Button>
				</div>
			</PanelRow>

			<OptionsModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				options={options}
				syncLabelValue={syncLabelValue}
				onChange={onChange}
				onSyncLabelValueChange={onSyncLabelValueChange}
				presets={presets}
				showDescription={showDescription}
				showImage={showImage}
			/>
		</>
	);
};
