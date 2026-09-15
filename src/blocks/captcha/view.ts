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

	captchaBlocks.forEach((block) => {
		const captchaType = block.getAttribute('data-captcha-type');
		const container = block.querySelector('.streamery-forms-captcha-container') as HTMLElement;

		if (!container) return;

		if (captchaType === 'friendlycaptcha' && config.friendlycaptcha?.enabled && config.friendlycaptcha.siteKey) {
			initFriendlyCaptcha(container, config.friendlycaptcha.siteKey);
		} else if (captchaType === 'recaptcha' && config.recaptcha?.enabled && config.recaptcha.siteKey) {
			initRecaptcha(container, config.recaptcha.siteKey);
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

	grecaptcha.ready(() => {
		grecaptcha.execute(siteKey, { action: 'submit' }).then((token: string) => {
			const input = document.createElement('input');
			input.type = 'hidden';
			input.name = 'g-recaptcha-response';
			input.value = token;
			container.appendChild(input);
		});
	});
}
