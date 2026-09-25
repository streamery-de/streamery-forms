/**
 * Skins registered in PHP via the 'streamery-forms/skins' filter, localized
 * onto window.streamery_forms.skins (see includes/Core/Skins.php).
 */
export type RegisteredSkin = {
	name: string;
	label: string;
	description?: string;
	url: string;
	extends?: string | null;
};

export const getRegisteredSkins = (): RegisteredSkin[] => {
	const skins = (window as any).streamery_forms?.skins;
	return Array.isArray(skins) ? skins : [];
};
