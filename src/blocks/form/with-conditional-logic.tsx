/**
 * Conditional logic for every block inside a form -- groups, headings,
 * columns, images, … -- not just Streamery Forms' own fields.
 *
 * The attribute is added to all other blocks client-side here and
 * server-side in includes/Core/ConditionalBlocks.php, which also writes
 * data-conditional-show onto the rendered block. Their saved markup is left
 * untouched, so existing content stays valid.
 */
import { addFilter } from '@wordpress/hooks';
import { useSelect } from '@wordpress/data';
import { createHigherOrderComponent } from '@wordpress/compose';
import { ConditionalLogicControls } from '../../components/block-atoms/ConditionalLogicControls';

/** Streamery Forms' own blocks handle conditional logic themselves (or don't support it). */
const appliesTo = (blockName: string) => !!blockName && !blockName.startsWith('streamery-forms/');

addFilter(
	'blocks.registerBlockType',
	'streamery-forms/conditional-logic-attribute',
	(settings: any, name: string) => {
		if (!appliesTo(name) || settings.attributes?.conditionalShow) {
			return settings;
		}
		return {
			...settings,
			attributes: {
				...settings.attributes,
				conditionalShow: { type: 'object' },
			},
		};
	}
);

const withConditionalLogic = createHigherOrderComponent((BlockEdit: any) => {
	return (props: any) => {
		const { clientId, name, attributes, setAttributes } = props;

		const isInsideForm = useSelect(
			(select: any) =>
				appliesTo(name) &&
				select('core/block-editor').getBlockParentsByBlockName(clientId, 'streamery-forms/form').length > 0,
			[clientId, name]
		);

		if (!isInsideForm) {
			return <BlockEdit {...props} />;
		}

		return (
			<>
				<BlockEdit {...props} />
				<ConditionalLogicControls
					clientId={clientId}
					conditionalShow={attributes.conditionalShow}
					setAttributes={setAttributes}
				/>
			</>
		);
	};
}, 'withConditionalLogic');

addFilter('editor.BlockEdit', 'streamery-forms/with-conditional-logic', withConditionalLogic);
