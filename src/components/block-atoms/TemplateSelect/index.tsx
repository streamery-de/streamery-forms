import { __ } from "@/lib/i18n";
import { type TemplateArray } from '@wordpress/blocks';
import { templates, type TemplateCategory } from './templates';
import './styles.css';

export type { TemplateCategory };

const CATEGORY_ORDER: TemplateCategory[] = ['start', 'basics', 'advanced', 'multistep'];
const CATEGORY_LABELS: Record<TemplateCategory, string> = {
	start: __('templateCategoryStart'),
	basics: __('templateCategoryBasics'),
	advanced: __('templateCategoryAdvanced'),
	multistep: __('templateCategoryMultiStep'),
};

type TemplateSelectProps = {
	onSelect: (value: TemplateArray) => void;
};

const TemplateSelect = ({ onSelect }: TemplateSelectProps) => {
	const byCategory = CATEGORY_ORDER.map((cat) => ({
		category: cat,
		label: CATEGORY_LABELS[cat],
		templates: templates.filter((t) => t.category === cat),
	})).filter((section) => section.templates.length > 0);

	return (
		<div className="streamery-forms-template-select">
			<p className="streamery-forms-template-select__intro">
				{__('templateSelectIntro')}
			</p>
			{byCategory.map((section) => (
				<section
					key={section.category}
					className="streamery-forms-template-select__section"
					data-category={section.category}
				>
					<h3 className="streamery-forms-template-select__title">{section.label}</h3>
					<div className="streamery-forms-template-select__grid">
						{section.templates.map((template, index) => (
							<TemplateCard
								key={`${section.category}-${index}`}
								label={template.label}
								value={template.value}
								onSelect={() => onSelect(template.value)}
							/>
						))}
					</div>
				</section>
			))}
		</div>
	);
};

type TemplateCardProps = {
	label: string;
	value: TemplateArray;
	onSelect: () => void;
};

const TemplateCard = ({ label, value, onSelect }: TemplateCardProps) => (
	<button
		type="button"
		className="streamery-forms-template-select__card"
		onClick={() => value && onSelect()}
	>
		{label}
	</button>
);

export default TemplateSelect;
