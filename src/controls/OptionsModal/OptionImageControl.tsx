import { __ } from '../../lib/i18n';
import { Button } from '@wordpress/components';
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { ImagePlus, X } from 'lucide-react';
import BlockIcon from '../../components/block-atoms/BlockIcon';
import { type Option } from '../OptionsRepeater';

interface OptionImageControlProps {
	option: Option;
	onChange: (option: Option) => void;
}

/**
 * Pick/remove the image of a single checkbox or radio option.
 */
export const OptionImageControl = ({ option, onChange }: OptionImageControlProps) => {
	const removeImage = () => {
		const { imageId, imageUrl, imageAlt, ...rest } = option;
		onChange(rest);
	};

	return (
		<div className="streamery-forms-options-table-image">
			<MediaUploadCheck>
				<MediaUpload
					allowedTypes={['image']}
					value={option.imageId}
					onSelect={(media: { id: number; url: string; alt?: string; sizes?: Record<string, { url: string }> }) =>
						onChange({
							...option,
							imageId: media.id,
							imageUrl: media.sizes?.medium?.url || media.sizes?.thumbnail?.url || media.url,
							imageAlt: media.alt || '',
						})
					}
					render={({ open }: { open: () => void }) =>
						option.imageUrl ? (
							<button
								type="button"
								className="streamery-forms-options-table-image-preview"
								onClick={open}
								aria-label={__('selectImage', 'Select image')}
							>
								<img src={option.imageUrl} alt={option.imageAlt || ''} />
							</button>
						) : (
							<Button
								onClick={open}
								icon={<BlockIcon icon={ImagePlus} clean={true} />}
								label={__('selectImage', 'Select image')}
								isSmall
								variant="tertiary"
							/>
						)
					}
				/>
			</MediaUploadCheck>
			{option.imageUrl && (
				<Button
					onClick={removeImage}
					icon={<BlockIcon icon={X} clean={true} />}
					label={__('removeImage', 'Remove image')}
					isSmall
					variant="tertiary"
					isDestructive
				/>
			)}
		</div>
	);
};
