<?php

declare(strict_types=1);

namespace StreameryForms\Assets;

use StreameryForms\Core\BlockScanner;
use StreameryForms\Traits\Base;
use StreameryForms\Libs\Assets;

defined('ABSPATH') || exit;

/**
 * Class Frontend
 *
 * Handles frontend asset loading for Streamery Forms, including skin styles.
 *
 * @package StreameryForms\Assets
 */
class Frontend
{

	use Base;

	/**
	 * Skin style handle for Streamery Forms.
	 */
	const SKIN_HANDLE = 'streamery-forms-skin';

	/**
	 * Development skin script path.
	 */
	const DEV_SKIN_SCRIPT = 'src/skins/default/skin.js';

	/**
	 * Frontend bootstrapper.
	 *
	 * @return void
	 */
	public function bootstrap()
	{
		// Localize script with assets URL
		add_action('wp_enqueue_scripts', array($this, 'localize_script'));

		// Load skin styles in block editor
		add_action('enqueue_block_editor_assets', array($this, 'enqueue_editor_skin_styles'));
	}

	/**
	 * Localize script with assets URL for frontend.
	 *
	 * @return void
	 */
	public function localize_script()
	{
		// Only emit any of this on pages that actually contain a form -- this
		// used to run on every single frontend request.
		if (! $this->current_page_has_form()) {
			return;
		}

		// Get REST API URL and nonce
		$api_url = rest_url();
		$nonce = wp_create_nonce('wp_rest');
		$captcha = $this->get_public_captcha_config();

		// reCAPTCHA stays a third-party *service* call (documented in readme.txt), but
		// per WP.org guideline 8 it must be enqueued, never DOM-injected by our JS.
		if (!empty($captcha['recaptcha']['enabled']) && !empty($captcha['recaptcha']['siteKey'])) {
			wp_enqueue_script(
				'streamery-forms-recaptcha',
				'https://www.google.com/recaptcha/api.js?render=' . rawurlencode($captcha['recaptcha']['siteKey']),
				array(),
				STREAMERY_FORMS_VERSION,
				true
			);
		}

		// Always set the streamery-forms object inline so it's available before view scripts run
		$inline_script = sprintf(
			'window.streamery_forms = window.streamery_forms || {}; window.streamery_forms.assetsUrl = %s; window.streamery_forms.pluginUrl = %s; window.streamery_forms.apiUrl = %s; window.streamery_forms.nonce = %s; window.streamery_forms.namespace = %s; window.streamery_forms.captcha = %s; window.streamery_forms.strings = %s; window.streamery_forms.postId = %s;',
			wp_json_encode(STREAMERY_FORMS_ASSETS_URL),
			wp_json_encode(STREAMERY_FORMS_URL),
			wp_json_encode($api_url),
			wp_json_encode($nonce),
			wp_json_encode(STREAMERY_FORMS_ROUTE_PREFIX),
			wp_json_encode($captcha),
			wp_json_encode($this->get_frontend_strings()),
			wp_json_encode(is_singular() ? (int) get_queried_object_id() : 0)
		);

		// Try to add inline script to wp-blocks, fallback to wp-util if not available
		if (wp_script_is('wp-blocks', 'registered')) {
			wp_add_inline_script(
				'wp-blocks',
				$inline_script,
				'before'
			);
		} else {
			// Fallback: add directly to head
			add_action('wp_head', function () use ($inline_script) {
				wp_print_inline_script_tag($inline_script);
			}, 1);
		}

		// Also try to localize the view script if it's registered
		// WordPress generates handles like: streamery-forms-form-view-script
		$view_script_handle = 'streamery-forms-form-view-script';
		if (wp_script_is($view_script_handle, 'registered')) {
			wp_localize_script(
				$view_script_handle,
				'streamery_forms',
				array(
					'assetsUrl' => STREAMERY_FORMS_ASSETS_URL,
					'pluginUrl' => STREAMERY_FORMS_URL,
					'apiUrl'    => $api_url,
					'nonce'     => $nonce,
					'namespace' => STREAMERY_FORMS_ROUTE_PREFIX,
					'captcha'   => $captcha,
					'strings'   => $this->get_frontend_strings(),
					'postId'    => is_singular() ? (int) get_queried_object_id() : 0,
				)
			);
		}
	}

	/**
	 * Translatable strings the frontend view scripts render, including the
	 * aria-labels a screen reader announces. These have to come from PHP --
	 * text hardcoded in the view scripts is unreachable for any .po file.
	 *
	 * @return array<string, string>
	 */
	private function get_frontend_strings(): array
	{
		return array(
			'cancelUpload'  => __('Cancel upload', 'streamery-forms'),
			'removeFile'    => __('Remove file', 'streamery-forms'),
			'uploadFailed'  => __('Upload failed', 'streamery-forms'),
			'networkError'  => __('Network error', 'streamery-forms'),
			'submitSuccess' => __('Thank you! Your submission has been received.', 'streamery-forms'),
			'submitError'   => __('Your submission could not be sent. Please try again.', 'streamery-forms'),
		);
	}

	/**
	 * Whether the request being rendered contains a Streamery Forms form.
	 *
	 * Checks the queried post's content plus any synced pattern it references,
	 * and errs on the side of loading for non-singular views (archives, widget
	 * areas, block themes) where the content isn't a single known post.
	 *
	 * @return bool
	 */
	private function current_page_has_form(): bool
	{
		/**
		 * Short-circuit the "does this page have a form?" check, for setups
		 * where forms are rendered from somewhere this can't see.
		 *
		 * @param bool|null $has_form True/false to force, null to auto-detect.
		 */
		$forced = apply_filters('streamery-forms/frontend/has_form', null);
		if (is_bool($forced)) {
			return $forced;
		}

		if (! is_singular()) {
			// Archives, search, block-theme templates: content isn't one known
			// post, so don't guess -- load as before.
			return true;
		}

		$post = get_post();
		if (! $post instanceof \WP_Post) {
			return true;
		}

		if (has_block('streamery-forms/form', $post)) {
			return true;
		}

		// A form may live inside a synced pattern referenced by this post.
		if (has_block('block', $post)) {
			foreach (BlockScanner::find_block_refs(parse_blocks($post->post_content)) as $ref_id) {
				$pattern = get_post($ref_id);
				if ($pattern instanceof \WP_Post && has_block('streamery-forms/form', $pattern)) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Public (non-secret) CAPTCHA config for the frontend: whether each
	 * provider is enabled and its site key. Never includes the secret key.
	 *
	 * @return array
	 */
	private function get_public_captcha_config(): array
	{
		$settings = get_option('streamery_forms_captcha_settings', array());
		$config   = array();

		foreach (array('recaptcha', 'friendlycaptcha') as $provider) {
			$provider_settings = is_array($settings[$provider] ?? null) ? $settings[$provider] : array();
			$config[$provider]  = array(
				'enabled' => !empty($provider_settings['enabled']),
				'siteKey' => $provider_settings['site_key'] ?? '',
			);
		}

		return $config;
	}

	/**
	 * Enqueue skin styles in block editor.
	 * This loads all available skins for preview in the editor.
	 *
	 * @return void
	 */
	public function enqueue_editor_skin_styles()
	{
		// Get all available skins from assets directory (built skins)
		$skins_dir = STREAMERY_FORMS_DIR . '/assets/blocks/skins';
		if (!is_dir($skins_dir)) {
			// Fallback to src/skins for development
			$skins_dir = STREAMERY_FORMS_DIR . '/src/skins';
			if (!is_dir($skins_dir)) {
				return;
			}
		}

		$skin_dirs = scandir($skins_dir);

		foreach ($skin_dirs as $skin_dir) {
			if ($skin_dir === '.' || $skin_dir === '..') {
				continue;
			}

			$skin_path = $skins_dir . '/' . $skin_dir;
			if (is_dir($skin_path)) {
				// Check for built CSS file first (assets/skins/{skin}/index.css)
				$css_file = $skins_dir . '/blocks/skins/' . $skin_dir . '/index.css';
				$is_built = strpos($skins_dir, 'assets/') !== false;

				if (!file_exists($css_file) && !$is_built) {
					// Fallback: check src/skins for development
					$src_css_file = STREAMERY_FORMS_DIR . '/src/skins/' . $skin_dir . '/index.css';
					if (file_exists($src_css_file)) {
						$css_file = $src_css_file;
						$css_url = STREAMERY_FORMS_URL . '/src/skins/' . $skin_dir . '/index.css';
					} else {
						continue;
					}
				} else {
					$css_url = STREAMERY_FORMS_ASSETS_URL . '/blocks/skins/' . $skin_dir . '/index.css';
				}

				$handle = 'streamery-forms-skin-' . $skin_dir;
				wp_enqueue_style(
					$handle,
					$css_url,
					array(),
					STREAMERY_FORMS_VERSION
				);
			}
		}
	}
}
