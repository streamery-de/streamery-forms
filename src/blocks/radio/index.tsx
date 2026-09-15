import { registerBlockType } from '@wordpress/blocks';
import BlockIcon from '../../components/block-atoms/BlockIcon';
import './style.css';

import Edit from './edit';
import save from './save';
import metadata from './block.json';

import { CircleDot } from 'lucide-react';
import {
	transformToInput,
	transformToTextarea,
	transformToSelect,
	transformToCheckbox,
	transformToRadio,
} from '../../lib/field-block-transforms';

registerBlockType(metadata.name as string, {
	...metadata,
	icon: <BlockIcon icon={CircleDot} />,
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
				blocks: ['streamery-forms/checkbox'],
				transform: (attributes: any) => transformToCheckbox(attributes),
			},
		],
		from: [
			{
				type: 'block',
				blocks: ['streamery-forms/input'],
				transform: (attributes: any) => transformToRadio(attributes),
			},
			{
				type: 'block',
				blocks: ['streamery-forms/textarea'],
				transform: (attributes: any) => transformToRadio(attributes),
			},
			{
				type: 'block',
				blocks: ['streamery-forms/select'],
				transform: (attributes: any) => transformToRadio(attributes),
			},
			{
				type: 'block',
				blocks: ['streamery-forms/checkbox'],
				transform: (attributes: any) => transformToRadio(attributes),
			},
		],
	},
} as any);
