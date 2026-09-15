import { CaptchaAttributes } from '@/blockTypes/captcha';
import { useBlockProps } from '@wordpress/block-editor';
import { type BlockSaveProps } from '@wordpress/blocks';
import { getFieldClasses } from '../../lib/utils';

export default function save(props: BlockSaveProps<CaptchaAttributes>) {
	const className = getFieldClasses(props.attributes);
	return (
		<div { ...useBlockProps.save({
			className,
			'data-captcha-type': props.attributes.captchaType,
		}) }>
			{props.attributes.label && <label htmlFor={props.attributes.id}>{props.attributes.label}</label>}
			<div className="streamery-forms-captcha-container" data-name={props.attributes.name} data-id={props.attributes.id}></div>
			{props.attributes.help && <p className="streamery-forms-field__help" id={`${props.attributes.id}-help`}>{props.attributes.help}</p>}
		</div>
	);
}

