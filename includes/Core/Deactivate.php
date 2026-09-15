<?php

namespace StreameryForms\Core;

use StreameryForms\Traits\Base;

defined('ABSPATH') || exit;

/**
 * Class Deactivate
 *
 * Handles plugin deactivation with optional database removal.
 *
 * @package StreameryForms\Core
 * @since 1.0.0
 */
class Deactivate
{

	use Base;

	/**
	 * Script and style handle.
	 *
	 * @var string
	 */
	const HANDLE = 'streamery-forms-deactivate';

	/**
	 * Initialize the deactivation handler.
	 *
	 * @return void
	 */
	public function init()
	{
		add_action('admin_enqueue_scripts', array($this, 'enqueue_assets'));
	}

	/**
	 * Enqueue the deactivation dialog on the Plugins screen.
	 *
	 * @param string $hook_suffix The current admin page.
	 * @return void
	 */
	public function enqueue_assets($hook_suffix)
	{
		if ('plugins.php' !== $hook_suffix || ! current_user_can('activate_plugins')) {
			return;
		}

		wp_enqueue_style(
			self::HANDLE,
			STREAMERY_FORMS_URL . 'assets/admin/deactivate.css',
			array(),
			STREAMERY_FORMS_VERSION
		);

		wp_enqueue_script(
			self::HANDLE,
			STREAMERY_FORMS_URL . 'assets/admin/deactivate.js',
			array('jquery'),
			STREAMERY_FORMS_VERSION,
			true
		);

		wp_localize_script(
			self::HANDLE,
			'streameryFormsDeactivate',
			array(
				'pluginBasename' => plugin_basename(STREAMERY_FORMS_PLUGIN_FILE),
				'restUrl'        => rest_url(STREAMERY_FORMS_ROUTE_PREFIX . '/database/remove'),
				'nonce'          => wp_create_nonce('wp_rest'),
				'i18n'           => array(
					'title'              => __('Deactivate Streamery Forms', 'streamery-forms'),
					'question'           => __('What would you like to do?', 'streamery-forms'),
					'disableLabel'       => __('Just disable the plugin', 'streamery-forms'),
					'disableDescription' => __('Keep all data and settings. You can reactivate the plugin later.', 'streamery-forms'),
					'removeLabel'        => __('Disable and remove database tables', 'streamery-forms'),
					'removeDescription'  => __('This will permanently delete all form entries, accounts, and settings. This action cannot be undone.', 'streamery-forms'),
					'cancel'             => __('Cancel', 'streamery-forms'),
					'confirm'            => __('Continue', 'streamery-forms'),
					'processing'         => __('Processing...', 'streamery-forms'),
					'removed'            => __('Database tables removed successfully. Deactivating plugin...', 'streamery-forms'),
					'removeError'        => __('Error removing database tables. Please try again.', 'streamery-forms'),
				),
			)
		);
	}
}
