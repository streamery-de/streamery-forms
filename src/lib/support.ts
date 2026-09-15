/**
 * "Support Gutenform" data, localized by \Gutenform\Admin\Support.
 *
 * Only outbound links -- nothing is ever loaded from the donation platforms
 * (WordPress.org guideline 7).
 */
import { apiPost } from "@/lib/api";

export interface SupportLinks {
	kofi?: string;
	githubSponsors?: string;
	review?: string;
}

interface SupportData {
	links: SupportLinks;
	dismissed: boolean;
	milestoneReached: boolean;
	milestoneEntries: number;
}

const DISMISSED_EVENT = "gutenform:support-dismissed";

export function getSupportData(): SupportData {
	const data = (window as any).gutenForm?.support as Partial<SupportData> | undefined;

	return {
		links: data?.links || {},
		dismissed: data?.dismissed ?? true,
		milestoneReached: data?.milestoneReached ?? false,
		milestoneEntries: data?.milestoneEntries ?? 0,
	};
}

export function hasSupportLinks(links: SupportLinks = getSupportData().links): boolean {
	return Boolean(links.kofi || links.githubSponsors || links.review);
}

/**
 * Hides the dismissible prompts for the current user, in this page and for
 * good (user meta). The static sidebar card in the settings is not affected.
 */
export async function dismissSupport(): Promise<void> {
	const data = (window as any).gutenForm?.support;
	if (data) {
		data.dismissed = true;
	}
	window.dispatchEvent(new Event(DISMISSED_EVENT));

	try {
		await apiPost("settings/support-dismissed", { dismissed: true });
	} catch (err) {
		console.error("Failed to dismiss support prompt:", err);
	}
}

export function onSupportDismissed(callback: () => void): () => void {
	window.addEventListener(DISMISSED_EVENT, callback);
	return () => window.removeEventListener(DISMISSED_EVENT, callback);
}
