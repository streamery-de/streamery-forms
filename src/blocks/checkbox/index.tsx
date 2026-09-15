import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@/lib/i18n';
import BlockIcon from '../../components/block-atoms/BlockIcon';
import './style.css';

import Edit from './edit';
import save from './save';
import metadata from './block.json';

import { CheckSquare } from 'lucide-react';
import { getCheckboxPresets } from './presets';
import { registerFieldVariations } from '../../lib/field-variations';
import {
	transformToInput,
	transformToTextarea,
	transformToSelect,
	transformToRadio,
	transformToCheckbox,
} from '../../lib/field-block-transforms';

registerBlockType(metadata.name as string, {
	...metadata,
	icon: <BlockIcon icon={CheckSquare} />,
	edit: Edit,
	save,
	transforms: {
		to: [
			{
				type: 'block',
				blocks: ['streamery-forms/input'],
				transform: (attributes: any) => transformToInput(attributes, 'text'),
			},
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
				blocks: ['streamery-forms/radio'],
				transform: (attributes: any) => transformToRadio(attributes),
			},
		],
		from: [
			{
				type: 'block',
				blocks: ['streamery-forms/input'],
				transform: (attributes: any) => transformToCheckbox(attributes),
			},
			{
				type: 'block',
				blocks: ['streamery-forms/textarea'],
				transform: (attributes: any) => transformToCheckbox(attributes),
			},
			{
				type: 'block',
				blocks: ['streamery-forms/select'],
				transform: (attributes: any) => transformToCheckbox(attributes),
			},
			{
				type: 'block',
				blocks: ['streamery-forms/radio'],
				transform: (attributes: any) => transformToCheckbox(attributes),
			},
		],
	},
} as any);

// Block Variations (Presets including Consent)
registerFieldVariations(metadata.name as string, getCheckboxPresets());
