import { __ } from "@/lib/i18n";
import { InspectorControls } from '@wordpress/block-editor';
import { TextControl, PanelBody, SelectControl, ExternalLink, Button } from '@wordpress/components';
import { type BlockEditProps } from '@wordpress/blocks';
import { useEffect, useState } from '@wordpress/element';
import { dismissSupport, getSupportData, hasSupportLinks, onSupportDismissed } from '@/lib/support';
import { type FormAttributes } from '@/blockTypes/form';
import builtInSkins from '../../skins';
import { getRegisteredSkins } from '@/lib/skins';
import { useProviderValidation } from '../../hooks/useProviderValidation';
import { MissingFieldsDialog } from '../../components/block-atoms/MissingFieldsDialog';

type FormInspectorControlsProps = BlockEditProps<FormAttributes>;

/**
 * Built-in skins first, then the ones a theme registered via the
 * 'streamery-forms/skins' filter -- the first entry for a name wins.
 */
const getSkinOptions = () => {
	const seen = new Set<string>();
	return [...builtInSkins, ...getRegisteredSkins()]
		.filter((skin) => {
			if (!skin.name || seen.has(skin.name)) {
				return false;
			}
			seen.add(skin.name);
			return true;
		})
		.map((skin) => ({ label: skin.label, value: skin.name }));
};

/**
 * Collapsed "Support Streamery Forms" panel -- form block only, admins only, gone
 * for good once dismissed.
 */
const SupportPanel = () => {
	const { links, dismissed: initiallyDismissed } = getSupportData();
	const [dismissed, setDismissed] = useState(initiallyDismissed);

	useEffect(() => onSupportDismissed(() => setDismissed(true)), []);

	if (dismissed || !hasSupportLinks(links)) {
		return null;
	}

	return (
		<PanelBody title={__('supportStreameryForms', 'Support Streamery Forms')} initialOpen={false}>
			<p>{__('supportText')}</p>
			{links.kofi && (
				<p>
					<ExternalLink href={links.kofi}>{__('supportOnKofi', 'Buy a coffee')}</ExternalLink>
				</p>
			)}
			{links.githubSponsors && (
				<p>
					<ExternalLink href={links.githubSponsors}>{__('sponsorOnGithub', 'Sponsor on GitHub')}</ExternalLink>
				</p>
			)}
			{links.review && (
				<p>
					<ExternalLink href={links.review}>{__('leaveReview', 'Leave a review')}</ExternalLink>
				</p>
			)}
			<Button variant="link" onClick={dismissSupport} style={{ color: '#757575' }}>
				{__('dismissSupport', "Don't show again")}
			</Button>
		</PanelBody>
	);
};

/**
 * The sidebar keeps only identity and presentation. Everything configurable
 * about *behaviour* (mailbox, providers, templates, conditional logic, spam
 * protection, privacy) moved into the Form Settings modal, reachable from the
 * toolbar at any nesting depth -- as stacked PanelBodys this had become
 * unusable, and it was only reachable when the form block itself was selected.
 */
export const FormInspectorControls = ({ attributes, setAttributes, clientId }: FormInspectorControlsProps) => {
	const {
		missingFields,
		shouldShowDialog,
		setShouldShowDialog,
	} = useProviderValidation(attributes.providerIds || [], clientId || '');

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('formSettings', 'Form Settings')}>
					<TextControl
						label={__('formTitle', 'Form Title')}
						value={attributes.formTitle}
						onChange={(formTitle) => setAttributes({ formTitle })}
						help={__('formTitleHelp', 'Shown as the title of this form in the admin and in notifications.')}
						__next40pxDefaultSize={true}
						__nextHasNoMarginBottom={true}
					/>
					<TextControl
						label={__('formIdentifier', 'Form Identifier')}
						value={attributes.formId}
						onChange={(formId) => setAttributes({ formId })}
						help={__('formIdentifierHelp', 'Used to identify this form and its entries. Changing it separates new entries from existing ones.')}
						__next40pxDefaultSize={true}
						__nextHasNoMarginBottom={true}
					/>
					<SelectControl
						label={__('skin')}
						value={attributes.skin || 'default'}
						onChange={(skin) => setAttributes({ skin })}
						options={getSkinOptions()}
						__next40pxDefaultSize={true}
						__nextHasNoMarginBottom={true}
					/>
				</PanelBody>
				<SupportPanel />
			</InspectorControls>
			<MissingFieldsDialog
				open={shouldShowDialog}
				onOpenChange={setShouldShowDialog}
				missingFields={missingFields}
				formClientId={clientId || ''}
				onFieldsAdded={() => {}}
			/>
		</>
	);
};
