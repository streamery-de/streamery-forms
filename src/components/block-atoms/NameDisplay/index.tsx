import { useState } from 'react';
import { Button, PanelRow, Tooltip } from '@wordpress/components';
import { Copy, Check } from 'lucide-react';
import { __ } from "@/lib/i18n";
import BlockIcon from '../BlockIcon';
import './styles.css';

type NameDisplayProps = {
	value: string;
};

export const NameDisplay = ({ value }: NameDisplayProps) => {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			// Fallback for older browsers
			const textArea = document.createElement('textarea');
			textArea.value = value;
			textArea.style.position = 'fixed';
			textArea.style.opacity = '0';
			document.body.appendChild(textArea);
			textArea.select();
			try {
				document.execCommand('copy');
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
			} catch (err) {
				console.error('Failed to copy:', err);
			}
			document.body.removeChild(textArea);
		}
	};

	return (
		<PanelRow>
			<div className="streamery-forms-name-display__container">
				<input
					type="text"
					value={value || ''}
					readOnly
					disabled
					className="streamery-forms-name-display__input"
					title={value}
				/>
				<Tooltip text={copied ? __('copiedExclamation') : __('copyToClipboard')}>
					<Button
						onClick={handleCopy}
						variant={copied ? 'primary' : 'secondary'}
						isSmall
						className={`streamery-forms-name-display__button ${copied ? 'streamery-forms-name-display__button--copied' : ''}`}
					>
						{copied ? (
							<>
								<BlockIcon icon={Check} clean={true} />
								<span>{__('copied')}</span>
							</>
						) : (
							<>
								<BlockIcon icon={Copy} clean={true} />
								<span>{__('copy')}</span>
							</>
						)}
					</Button>
				</Tooltip>
			</div>
		</PanelRow>
	);
};

