import { registerBlockType } from '@wordpress/blocks';
import BlockIcon from '../../components/block-atoms/BlockIcon';
import './style.css';

import Edit from './edit'; 
import save from './save';
import deprecated from './deprecated';
import metadata from './block.json';

import { TextCursorInput } from 'lucide-react';
import { getInputPresets } from './presets';
import { registerFieldVariations } from '../../lib/field-variations';
import {
	transformToTextarea,
	transformToSelect,
	transformToInput,
	transformToCheckbox,
	transformToRadio,
	transformToDateTime,
	transformToSlider,
} from '../../lib/field-block-transforms';

registerBlockType(metadata.name as string, {
	...metadata,
	icon: <BlockIcon icon={TextCursorInput} />,
	edit: Edit,
	save,
	deprecated,
	transforms: {
		to: [
			{
				type: 'block',
				blocks: ['streamery-forms/textarea'],
				transform: (attributes: any) => transformToTextarea(attributes),
			},
			{
				type: 'block',
				blocks: ['streamery-forms/select'],
				transform: (attributes: any) => transformToSelect(attributes),
			},
			{
				type: 'block',
				blocks: ['streamery-forms/checkbox'],
				transform: (attributes: any) => transformToCheckbox(attributes),
			},
			{
				type: 'block',
				blocks: ['streamery-forms/radio'],
				transform: (attributes: any) => transformToRadio(attributes),
			},
			{
				type: 'block',
				blocks: ['streamery-forms/date-time'],
				transform: (attributes: any) => transformToDateTime(attributes),
			},
			{
				type: 'block',
				blocks: ['streamery-forms/slider'],
				transform: (attributes: any) => transformToSlider(attributes),
			},
		],
		from: [
			{
				type: 'block',
				blocks: ['streamery-forms/textarea'],
				transform: (attributes: any) => transformToInput(attributes, 'text'),
			},
			{
				type: 'block',
				blocks: ['streamery-forms/select'],
				transform: (attributes: any) => transformToInput(attributes, 'text'),
			},
			{
				type: 'block',
				blocks: ['streamery-forms/checkbox'],
				transform: (attributes: any) => transformToInput(attributes, 'text'),
			},
			{
				type: 'block',
				blocks: ['streamery-forms/radio'],
				transform: (attributes: any) => transformToInput(attributes, 'text'),
			},
			{
				type: 'block',
				blocks: ['streamery-forms/date-time'],
				transform: (attributes: any) => transformToInput(attributes, 'text'),
			},
			{
				type: 'block',
				blocks: ['streamery-forms/slider'],
				transform: (attributes: any) => transformToInput(attributes, 'text'),
			},
		],
	},
} as any);

// Block Variations (Presets)
registerFieldVariations(metadata.name as string, getInputPresets(), ['input', 'field']);

