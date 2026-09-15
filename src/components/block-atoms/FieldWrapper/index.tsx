import { __ } from "@/lib/i18n";
import { RichText, useBlockProps } from '@wordpress/block-editor';
import { getFieldClasses } from '../../../lib/utils';

type FieldWrapperProps = {
	label: string;
	onLabelChange: (label: string) => void;
	help: string;
	onHelpChange: (help: string) => void;
	children: React.ReactNode;
	attributes: any;
	className?: string;
};

export const FieldWrapper = ({
	label,
	onLabelChange,
	help,
	onHelpChange,
	children,
	attributes,
	className,
}: FieldWrapperProps) => {
	return (
		<div { ...useBlockProps({
			className: className || getFieldClasses(attributes),
		}) }>
			<RichText
				tagName="label"
				value={label}
				onChange={onLabelChange}
				placeholder={__('enterLabel')}
			/>
			{children}
			<RichText
				tagName="p"
				value={help}
				onChange={onHelpChange}
				className="streamery-forms-field__help"
				placeholder={__('enterHelpText')}
			/>
		</div>
	);
};

