/**
 * CAPTCHA Block Frontend Script
 * Initializes FriendlyCaptcha (bundled locally, no CDN) and Google reCAPTCHA v3.
 * Site keys come from the plugin's global CAPTCHA settings (window.streamery_forms.captcha),
 * never from block attributes -- only "which provider" is a per-block choice.
 */
import { WidgetInstance } from 'friendly-challenge';

interface StreameryFormsCaptchaConfig {
	recaptcha?: { enabled: boolean; siteKey: string };
	friendlycaptcha?: { enabled: boolean; siteKey: string };
}

window.addEventListener('DOMContentLoaded', () => {
	const captchaBlocks = document.querySelectorAll('.wp-block-streamery-forms-captcha');
	const config: StreameryFormsCaptchaConfig = (window as any).streamery_forms?.captcha || {};

	// The provider is a site-wide setting and only one can be active, so the
	// block's data-captcha-type (from older content) is not consulted: a block
	// saved as "friendlycaptcha" must still work when reCAPTCHA is active.
	captchaBlocks.forEach((block) => {
		const container = block.querySelector('.streamery-forms-captcha-container') as HTMLElement;

		if (!container) return;

		if (config.recaptcha?.enabled && config.recaptcha.siteKey) {
			initRecaptcha(container, config.recaptcha.siteKey);
		} else if (config.friendlycaptcha?.enabled && config.friendlycaptcha.siteKey) {
			initFriendlyCaptcha(container, config.friendlycaptcha.siteKey);
		}
	});
});

function initFriendlyCaptcha(container: HTMLElement, siteKey: string) {
	const widgetEl = document.createElement('div');
	container.appendChild(widgetEl);

	const responseInput = document.createElement('input');
	responseInput.type = 'hidden';
	responseInput.name = 'frc-captcha-response';
	container.appendChild(responseInput);

	new WidgetInstance(widgetEl, {
		sitekey: siteKey,
		startMode: 'auto',
		doneCallback: (solution: string) => {
			responseInput.value = solution;
		},
		errorCallback: () => {
			responseInput.value = '';
		},
	});
}

function initRecaptcha(container: HTMLElement, siteKey: string) {
	// The reCAPTCHA API script is wp_enqueue_script()'d server-side (see
	// Assets/Frontend.php) whenever this provider is enabled -- never
	// DOM-injected here, per WP.org guideline 8.
	const grecaptcha = (window as any).grecaptcha;
	if (!grecaptcha) return;

	const input = document.createElement('input');
	input.type = 'hidden';
	input.name = 'g-recaptcha-response';
	container.appendChild(input);

	// A v3 token is valid for two minutes and can be verified only once, so a
	// token fetched at page load fails for anyone who takes longer to fill in
	// the form or submits twice. Refresh it well inside that window.
	const refresh = () => {
		grecaptcha.execute(siteKey, { action: 'submit' }).then((token: string) => {
			input.value = token;
		});
	};

	grecaptcha.ready(() => {
		refresh();
		window.setInterval(refresh, 90 * 1000);
	});
}
