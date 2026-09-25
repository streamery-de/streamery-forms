<?php

use StreameryForms\Core\Api;
use StreameryForms\Core\Capabilities;
use StreameryForms\Core\FormRegistry;
use StreameryForms\Core\Privacy;
use StreameryForms\Core\PopulatedSelect;
use StreameryForms\Core\ConditionalBlocks;
use StreameryForms\Core\Install;
use StreameryForms\Core\Deactivate;
use StreameryForms\Core\Smtp;
use StreameryForms\Core\EmailLogger;
use StreameryForms\Admin\Menu;
use StreameryForms\Admin\AdminBar;
use StreameryForms\Admin\Support;
use StreameryForms\Assets\Frontend;
use StreameryForms\Assets\Admin;
use StreameryForms\Traits\Base;

defined('ABSPATH') || exit;

/**
 * Class Streamery Forms
 *
 * The main class for the Coldmailar plugin, responsible for initialization and setup.
 *
 * @since 1.0.0
 */
final class StreameryForms
{

	use Base;

	/**
	 * Class constructor to set up constants for the plugin.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function __construct()
	{
		// STREAMERY_FORMS_PLUGIN_FILE must point at the main plugin bootstrap file
		// (streamery-forms.php), not this file, since plugin_basename() and
		// get_file_data() need the file WordPress registered as the plugin (the
		// one carrying the plugin header).
		$this->define('STREAMERY_FORMS_PLUGIN_FILE', __DIR__ . '/streamery-forms.php');
		$this->define('STREAMERY_FORMS_DIR', plugin_dir_path(STREAMERY_FORMS_PLUGIN_FILE));
		$this->define('STREAMERY_FORMS_URL', plugin_dir_url(STREAMERY_FORMS_PLUGIN_FILE));
		$this->define('STREAMERY_FORMS_ASSETS_URL', STREAMERY_FORMS_URL . '/assets');
		$this->define('STREAMERY_FORMS_ROUTE_PREFIX', 'streamery-forms/v1');

		$plugin_data = get_file_data(STREAMERY_FORMS_PLUGIN_FILE, array('Version' => 'Version'));
		$this->define('STREAMERY_FORMS_VERSION', ! empty($plugin_data['Version']) ? $plugin_data['Version'] : '1.0.0');
	}

	/**
	 * Defines a constant only when it is not already taken.
	 *
	 * @param string $name  Constant name.
	 * @param mixed  $value Constant value.
	 * @return void
	 */
	private function define($name, $value)
	{
		if (! defined($name)) {
			// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.VariableConstantNameFound -- $name is always a STREAMERY_FORMS_* constant.
			define($name, $value);
		}
	}

	/**
	 * Main execution point where the plugin will fire up.
	 *
	 * Initializes necessary components for admin, blocks, and API.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function init()
	{
		if (is_admin()) {
			Menu::get_instance()->init();
			Support::get_instance()->init();
			Admin::get_instance()->bootstrap();
			Deactivate::get_instance()->init();
			\StreameryForms\Core\Crypto::maybe_show_unavailable_notice();
		}

		// Admin bar (runs on frontend and admin).
		AdminBar::get_instance()->init();

		// Bring the database schema up to date on existing installs -- migrations
		// used to run only in the activation hook, so a plugin update that adds
		// a table (like streamery_forms_forms) never reached them.
		Install::get_instance()->maybe_upgrade_database();

		// Initialze core functionalities.
		Capabilities::get_instance()->init();
		FormRegistry::get_instance()->init();
		Privacy::get_instance()->init();
		PopulatedSelect::get_instance()->init();
		ConditionalBlocks::get_instance()->init();
		\StreameryForms\Core\Retention::get_instance()->init();
		Frontend::get_instance()->bootstrap();
		API::get_instance()->init();
		Smtp::get_instance()->init();
		EmailLogger::get_instance()->init();

		add_action('init', array($this, 'register_blocks'), 10);
	}

	public function register_blocks()
	{
		$blocks_dir = __DIR__ . '/assets/blocks/';
		if (is_dir($blocks_dir)) {
			foreach (scandir($blocks_dir) as $block) {
				if ($block === '.' || $block === '..') {
					continue;
				}
				$block_path = $blocks_dir . $block;
				if (is_dir($block_path) && file_exists($block_path . '/block.json')) {
					register_block_type($block_path);
				}
			}
		}
	}
}
