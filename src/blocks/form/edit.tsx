import { 
	InnerBlocks, 
	useBlockProps, 
	useInnerBlocksProps,	
	/** @ts-expect-error */
	__experimentalUseBorderProps as useBorderProps,
	/** @ts-expect-error */
	__experimentalUseColorProps as useColorProps, 
} from '@wordpress/block-editor';
import { dispatch } from '@wordpress/data';
import { type BlockEditProps, createBlocksFromInnerBlocksTemplate } from '@wordpress/blocks';
import { type FormAttributes } from '@/blockTypes/form';
import { useSelect } from '@wordpress/data';
import TemplateSelect from '../../components/block-atoms/TemplateSelect';
import { allowedBlocks, prioritizedInserterBlocks } from './allowedBlocks';
import './editor.css';
import { getFormClasses } from '../../lib/utils';
import { FormInspectorControls } from './inspector-controls';
import { FormBlockControls } from './block-controls';
import { useUniqueID } from '../../lib/use-unique-id';
import clsx from 'clsx';

export default function Edit(props: BlockEditProps<FormAttributes>) {
	const { attributes, setAttributes, clientId } = props;

	// Automatically generate and set unique form ID
	useUniqueID(
		attributes.formId,
		clientId,
		(attrs: { id: string }) => setAttributes({ formId: attrs.id }),
		'streamery-forms'
	);

	// Get all inner blocks using useSelect
	const innerBlockItems = useSelect(
		(select: any) => select('core/block-editor').getBlocks(clientId),
		[clientId]
	);

	const borderProps = useBorderProps( attributes );
	const colorProps = useColorProps( attributes );

	const blockProps = useBlockProps({
		className: clsx(
			getFormClasses(attributes), 
			colorProps.className,
			borderProps.className,
		),
		style: {
			...borderProps.style,
			...colorProps.style,
		},
	});

	const innerBlockProps = useInnerBlocksProps({}, {
		allowedBlocks: allowedBlocks,
		prioritizedInserterBlocks: prioritizedInserterBlocks,
		renderAppender: InnerBlocks.ButtonBlockAppender, 
		/** @ts-expect-error */
		layout: attributes.layout,
		__experimentalTemplateInsertUpdatesSelection: true,
		template: [
			['core/columns', {}, [
				['core/column', {}, [
					['core/heading', {}],
				]],
			]]
		]
	});

	const replaceWithTemplate = (template: import('@wordpress/blocks').TemplateArray) => {
		const blocks = createBlocksFromInnerBlocksTemplate(template as any);
		dispatch('core/block-editor').replaceInnerBlocks(clientId, blocks);
	};

	return (
		<>
			<FormBlockControls
				{...props}
				hasBlocks={(innerBlockItems?.length ?? 0) > 0}
				onReplaceWithTemplate={replaceWithTemplate}
			/>
			<FormInspectorControls {...props} />
			<form { ...blockProps }>
				{innerBlockItems?.length > 0 ? (
					<div { ...innerBlockProps } />
				) : (
					<TemplateSelect onSelect={replaceWithTemplate} />
				)}
			</form>
		</>
	);
}
