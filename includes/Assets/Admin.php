<?php

declare(strict_types=1);

namespace Gutenform\Assets;

use Gutenform\Traits\Base;
use Gutenform\Libs\Assets;
use Gutenform\Assets\Strings;

defined('ABSPATH') || exit;

/**
 * Class Admin
 *
 * Handles admin functionalities for the Gutenform.
 *
 * @package Gutenform\Admin
 */
class Admin
{

	use Base;

	/**
	 * Script handle for Gutenform.
	 */
	const HANDLE = 'gutenform';

	/**
	 * JS Object name for Gutenform.
	 */
	const OBJ_NAME = 'gutenForm';

	/**
	 * Development script path for Gutenform.
	 */
	const DEV_SCRIPT = 'src/admin/main.jsx';

	/**
	 * List of allowed screens for script enqueue.
	 *
	 * @var array
	 */
	private $allowed_screens = array(
		'toplevel_page_gutenform',
		'gutenform_page_gutenform-forms-usage',
		'gutenform_page_gutenform-settings',
	);

	/**
	 * Admin bootstrapper.
	 *
	 * @return void
	 */
	public function bootstrap()
	{
		add_action('admin_enqueue_scripts', array($this, 'enqueue_script'));
		add_action('enqueue_block_editor_assets', array($this, 'localize_editor_scripts'));
	}

	/**
	 * Enqueue script based on the current screen.
	 *
	 * @param string $screen The current screen.
	 */
	public function enqueue_script($screen)
	{
		if (in_array($screen, $this->allowed_screens, true)) {
			$enqueued = Assets\enqueue_asset(
				GUTENFORM_DIR . '/assets/admin/dist',
				self::DEV_SCRIPT,
				$this->get_config()
			);
			if ($enqueued) {
				wp_localize_script(self::HANDLE, self::OBJ_NAME, $this->get_data());
				// Load translations for JavaScript
				// Use same path format as load_plugin_textdomain
				$plugin_rel_path = dirname(plugin_basename(GUTENFORM_PLUGIN_FILE)) . '/languages';
				wp_set_script_translations(self::HANDLE, 'gutenform-builder', $plugin_rel_path);
			}
		}
	}

	/**
	 * Get the script configuration.
	 *
	 * @return array The script configuration.
	 */
	public function get_config()
	{
		return array(
			'dependencies' => array('react', 'react-dom', 'wp-i18n'),
			'handle'       => self::HANDLE,
			'in-footer'    => true,
		);
	}

	/**
	 * Get data for script localization.
	 *
	 * @return array The localized script data.
	 */
	public function get_data()
	{

		return array(
			'developer'            => 'prappo',
			'isAdmin'              => is_admin(),
			'apiUrl'               => rest_url(),
			'adminUrl'             => admin_url('admin.php'),
			'nonce'                => wp_create_nonce('wp_rest'),
			'userInfo'             => $this->get_user_data(),
			'strings'              => Strings::get_strings(),
			'providersIconBaseUrl'   => defined('GUTENFORM_ASSETS_URL') ? GUTENFORM_ASSETS_URL . '/providers/' : '',
			'support'              => \Gutenform\Admin\Support::get_script_data(),
		);
	}

	/**
	 * Localize editor scripts for block editor.
	 *
	 * @return void
	 */
	public function localize_editor_scripts()
	{
		// Get all registered block editor scripts
		$editor_script_handles = array(
			'gutenform-form-editor-script',
			'gutenform-input-editor-script',
			'gutenform-textarea-editor-script',
			'gutenform-select-editor-script',
			'gutenform-checkbox-editor-script',
			'gutenform-radio-editor-script',
			'gutenform-date-time-editor-script',
			'gutenform-slider-editor-script',
			'gutenform-submit-editor-script',
			'gutenform-success-editor-script',
			'gutenform-file-editor-script',
			'gutenform-step-editor-script',
			'gutenform-step-navigation-editor-script',
			'gutenform-save-progress-editor-script',
			'gutenform-progress-editor-script',
		);

		// Get WordPress upload limit in MB
		$upload_size_limit = wp_max_upload_size();
		$upload_limit_mb = round($upload_size_limit / 1024 / 1024, 0);

		foreach ($editor_script_handles as $handle) {
			if (wp_script_is($handle, 'registered')) {
				// Pass strings to block editor via gutenform object (lowercase)
				$editor_data = array(
					'strings' => Strings::get_strings(),
					'uploadLimit' => $upload_limit_mb,
				);
				wp_localize_script($handle, 'gutenform', $editor_data);
				// Also pass via gutenForm for consistency
				wp_localize_script($handle, self::OBJ_NAME, $this->get_data());
			}
		}
	}

	/**
	 * Get user data for script localization.
	 *
	 * @return array The user data.
	 */
	private function get_user_data()
	{
		$username   = '';
		$avatar_url = '';

		if (is_user_logged_in()) {
			// Get current user's data .
			$current_user = wp_get_current_user();

			// Get username.
			$username = $current_user->user_login; // or use user_nicename, display_name, etc.

			// Get avatar URL.
			$avatar_url = get_avatar_url($current_user->ID);
		}

		return array(
			'username' => $username,
			'avatar'   => $avatar_url,
		);
	}
}
