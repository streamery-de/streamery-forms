import { registerBlockType } from '@wordpress/blocks';
import { __ } from "@/lib/i18n";
import BlockIcon from '../../components/block-atoms/BlockIcon';
import './style.css';

import Edit from './edit'; 
import save from './save';
import deprecated from './deprecated';
import metadata from './block.json';

import { ListChecks } from 'lucide-react';
import {
	transformToInput,
	transformToTextarea,
	transformToSelect,
	transformToCheckbox,
	transformToRadio,
	transformToDateTime,
	transformToSlider,
} from '../../lib/field-block-transforms';

registerBlockType(metadata.name as string, {
	...metadata,
	icon: <BlockIcon icon={ListChecks} />,
	edit: Edit,
	save,
	deprecated,
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
				blocks: ['streamery-forms/input'],
				transform: (attributes: any) => transformToSelect(attributes),
			},
			{
				type: 'block',
				blocks: ['streamery-forms/textarea'],
				transform: (attributes: any) => transformToSelect(attributes),
			},
			{
				type: 'block',
				blocks: ['streamery-forms/checkbox'],
				transform: (attributes: any) => transformToSelect(attributes),
			},
			{
				type: 'block',
				blocks: ['streamery-forms/radio'],
				transform: (attributes: any) => transformToSelect(attributes),
			},
			{
				type: 'block',
				blocks: ['streamery-forms/date-time'],
				transform: (attributes: any) => transformToSelect(attributes),
			},
			{
				type: 'block',
				blocks: ['streamery-forms/slider'],
				transform: (attributes: any) => transformToSelect(attributes),
			},
		],
	},
} as any);

