import { registerBlockType } from '@wordpress/blocks';
import { addFilter } from '@wordpress/hooks';
import BlockIcon from '../../components/block-atoms/BlockIcon';
import './style.css';

import Edit from './edit';
import save from './save';
import metadata from './block.json';
import withFormToolbar from './with-form-toolbar';
import './with-conditional-logic';

import { LayoutDashboard } from 'lucide-react';

registerBlockType( metadata.name as string, {
	...metadata,
	icon: (<BlockIcon icon={LayoutDashboard} />),
	edit: Edit,
	save,
} as any );

// Registers the step switcher AND the Form Settings button on every block
// inside a form, at any nesting depth.
addFilter('editor.BlockEdit', 'streamery-forms/with-form-toolbar', withFormToolbar);
