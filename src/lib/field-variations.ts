import { createElement } from '@wordpress/element';
import { registerBlockVariation, type BlockVariation } from '@wordpress/blocks';
import { type LucideIcon } from 'lucide-react';
import BlockIcon from '../components/block-atoms/BlockIcon';

export type FieldVariationPreset<TAttributes extends Record<string, unknown>> = {
	name: string;
	title: string;
	description?: string;
	icon: LucideIcon;
	attributes: Partial<TAttributes>;
	isDefault?: boolean;
	/** Extra inserter search terms for this variation. */
	keywords?: string[];
	isActive?: (attributes: TAttributes) => boolean;
};

export function getActiveFieldVariation<TAttributes extends Record<string, unknown>>(
	presets: FieldVariationPreset<TAttributes>[],
	attributes: TAttributes,
): FieldVariationPreset<TAttributes> | undefined {
	return presets.find((preset) => preset.isActive?.(attributes)) ?? presets[0];
}

export function registerFieldVariations<TAttributes extends Record<string, unknown>>(
	blockName: string,
	presets: FieldVariationPreset<TAttributes>[],
	/** Search terms shared by every variation, e.g. the block's own name. */
	keywords: string[] = [],
): void {
	presets.forEach((preset, index) => {
		const variation: BlockVariation = {
			name: preset.name,
			title: preset.title,
			description: preset.description,
			icon: createElement(BlockIcon, { icon: preset.icon }),
			attributes: preset.attributes as BlockVariation['attributes'],
			scope: ['inserter', 'block', 'transform'],
			isDefault: preset.isDefault ?? index === 0,
			keywords: [...keywords, ...(preset.keywords ?? [])],
		};

		if (preset.isActive) {
			variation.isActive = (blockAttributes) =>
				preset.isActive!(blockAttributes as TAttributes);
		}

		registerBlockVariation(blockName, variation);
	});
}
