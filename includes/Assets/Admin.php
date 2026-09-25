<?php

declare(strict_types=1);

namespace StreameryForms\Assets;

use StreameryForms\Traits\Base;
use StreameryForms\Libs\Assets;
use StreameryForms\Assets\Strings;
use StreameryForms\Core\Skins;

defined('ABSPATH') || exit;

/**
 * Class Admin
 *
 * Handles admin functionalities for the Streamery Forms.
 *
 * @package StreameryForms\Admin
 */
class Admin
{

	use Base;

	/**
	 * Script handle for Streamery Forms.
	 */
	const HANDLE = 'streamery-forms';

	/**
	 * JS Object name for Streamery Forms.
	 */
	const OBJ_NAME = 'streameryForms';

	/**
	 * Development script path for Streamery Forms.
	 */
	const DEV_SCRIPT = 'src/admin/main.jsx';

	/**
	 * List of allowed screens for script enqueue.
	 *
	 * @var array
	 */
	private $allowed_screens = array(
		'toplevel_page_streamery-forms',
		'streamery-forms_page_streamery-forms-forms-usage',
		'streamery-forms_page_streamery-forms-settings',
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
				STREAMERY_FORMS_DIR . '/assets/admin/dist',
				self::DEV_SCRIPT,
				$this->get_config()
			);
			if ($enqueued) {
				wp_localize_script(self::HANDLE, self::OBJ_NAME, $this->get_data());
				wp_set_script_translations(self::HANDLE, 'streamery-forms');
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
			'providersIconBaseUrl'   => defined('STREAMERY_FORMS_ASSETS_URL') ? STREAMERY_FORMS_ASSETS_URL . '/providers/' : '',
			'support'              => \StreameryForms\Admin\Support::get_script_data(),
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
			'streamery-forms-form-editor-script',
			'streamery-forms-input-editor-script',
			'streamery-forms-textarea-editor-script',
			'streamery-forms-select-editor-script',
			'streamery-forms-checkbox-editor-script',
			'streamery-forms-radio-editor-script',
			'streamery-forms-date-time-editor-script',
			'streamery-forms-slider-editor-script',
			'streamery-forms-submit-editor-script',
			'streamery-forms-success-editor-script',
			'streamery-forms-file-editor-script',
			'streamery-forms-step-editor-script',
			'streamery-forms-step-navigation-editor-script',
			'streamery-forms-save-progress-editor-script',
			'streamery-forms-progress-editor-script',
			'streamery-forms-field-value-editor-script',
		);

		// Get WordPress upload limit in MB
		$upload_size_limit = wp_max_upload_size();
		$upload_limit_mb = round($upload_size_limit / 1024 / 1024, 0);

		foreach ($editor_script_handles as $handle) {
			if (wp_script_is($handle, 'registered')) {
				// Pass strings to block editor via streamery_forms object (lowercase)
				$editor_data = array(
					'strings' => Strings::get_strings(),
					'uploadLimit' => $upload_limit_mb,
					'skins' => Skins::get_instance()->get_client_config(),
				);
				wp_localize_script($handle, 'streamery_forms', $editor_data);
				// Also pass via streameryForms for consistency
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
