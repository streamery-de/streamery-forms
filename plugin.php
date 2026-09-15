<?php

use Gutenform\Core\Api;
use Gutenform\Core\Capabilities;
use Gutenform\Core\FormRegistry;
use Gutenform\Core\Privacy;
use Gutenform\Core\PopulatedSelect;
use Gutenform\Core\Install;
use Gutenform\Core\Deactivate;
use Gutenform\Core\Smtp;
use Gutenform\Core\EmailLogger;
use Gutenform\Admin\Menu;
use Gutenform\Admin\AdminBar;
use Gutenform\Admin\Support;
use Gutenform\Assets\Frontend;
use Gutenform\Assets\Admin;
use Gutenform\Traits\Base;

defined('ABSPATH') || exit;

/**
 * Class Gutenform
 *
 * The main class for the Coldmailar plugin, responsible for initialization and setup.
 *
 * @since 1.0.0
 */
final class Gutenform
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
		// GUTENFORM_PLUGIN_FILE must point at the main plugin bootstrap file
		// (gutenform-builder.php), not this file, since plugin_basename() and
		// get_file_data() need the file WordPress registered as the plugin (the
		// one carrying the plugin header).
		//
		// The GF_ prefix these constants used to carry is Gravity Forms' prefix,
		// and they were defined without a guard -- a collision produced a PHP
		// warning and silently kept the *other* plugin's value. Everything is
		// GUTENFORM_ now, each guarded.
		$this->define('GUTENFORM_PLUGIN_FILE', __DIR__ . '/gutenform-builder.php');
		$this->define('GUTENFORM_DIR', plugin_dir_path(GUTENFORM_PLUGIN_FILE));
		$this->define('GUTENFORM_URL', plugin_dir_url(GUTENFORM_PLUGIN_FILE));
		$this->define('GUTENFORM_ASSETS_URL', GUTENFORM_URL . '/assets');
		$this->define('GUTENFORM_ROUTE_PREFIX', 'gutenform/v1');

		$plugin_data = get_file_data(GUTENFORM_PLUGIN_FILE, array('Version' => 'Version'));
		$this->define('GUTENFORM_VERSION', ! empty($plugin_data['Version']) ? $plugin_data['Version'] : '1.0.0');

		$this->define_legacy_aliases();
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
			// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.VariableConstantNameFound -- $name is always a GUTENFORM_* (or legacy GF_*) constant.
			define($name, $value);
		}
	}

	/**
	 * Keeps the old GF_* constants working.
	 *
	 * Deprecated since 1.0.0 -- they exist purely so an add-on built against an
	 * earlier build (for example the Pro plugin) does not fatal. Guarded, so a
	 * plugin that legitimately owns the GF_ prefix wins and we never clobber it.
	 *
	 * @return void
	 */
	private function define_legacy_aliases()
	{
		$aliases = array(
			'GF_PLUGIN_FILE'  => GUTENFORM_PLUGIN_FILE,
			'GF_DIR'          => GUTENFORM_DIR,
			'GF_URL'          => GUTENFORM_URL,
			'GF_ASSETS_URL'   => GUTENFORM_ASSETS_URL,
			'GF_ROUTE_PREFIX' => GUTENFORM_ROUTE_PREFIX,
			'GF_VERSION'      => GUTENFORM_VERSION,
		);

		foreach ($aliases as $name => $value) {
			$this->define($name, $value);
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
			\Gutenform\Core\Crypto::maybe_show_unavailable_notice();
		}

		// Admin bar (runs on frontend and admin).
		AdminBar::get_instance()->init();

		// Bring the database schema up to date on existing installs -- migrations
		// used to run only in the activation hook, so a plugin update that adds
		// a table (like gutenform_forms) never reached them.
		Install::get_instance()->maybe_upgrade_database();

		// Initialze core functionalities.
		Capabilities::get_instance()->init();
		FormRegistry::get_instance()->init();
		Privacy::get_instance()->init();
		PopulatedSelect::get_instance()->init();
		\Gutenform\Core\Retention::get_instance()->init();
		Frontend::get_instance()->bootstrap();
		API::get_instance()->init();
		Smtp::get_instance()->init();
		EmailLogger::get_instance()->init();

		add_action('init', array($this, 'i18n'), 1);
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


	/**
	 * Internationalization setup for language translations.
	 *
	 * Loads the plugin text domain for localization.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function i18n()
	{
		// Also shipped as a standalone zip, not only via WordPress.org.
		load_plugin_textdomain('gutenform-builder', false, dirname(plugin_basename(GUTENFORM_PLUGIN_FILE)) . '/languages/'); // phpcs:ignore PluginCheck.CodeAnalysis.DiscouragedFunctions.load_plugin_textdomainFound
	}
}
