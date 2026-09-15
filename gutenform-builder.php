<?php

/**
 * Plugin Name: Gutenform Builder
 * Plugin URI: https://gutenform.de
 * Description: A modern WordPress form builder plugin built with Gutenberg blocks. Create beautiful, responsive forms directly in the WordPress block editor and manage all submissions through an intuitive inbox interface. Features an extensible provider system for handling form submissions via email, database, or custom providers.
 * Author: Streamery
 * Author URI: https://streamery.de
 * License: GPL-2.0-or-later
 * Version: 1.0.1
 * Requires at least: 6.5
 * Requires PHP: 7.4
 * Text Domain: gutenform-builder
 * Domain Path: /languages
 *
 * @package Gutenform
 */

defined('ABSPATH') || exit;

/**
 * Reports a broken installation instead of fatalling.
 *
 * vendor/ and assets/blocks/ are build output and are not in version control,
 * so a copy taken straight from git (rather than from a release zip) has
 * neither. Previously the unguarded `require vendor/autoload.php` below turned
 * that into a white screen on every page of the site.
 *
 * @param string $missing Human-readable description of what is missing.
 * @return void
 */
function gutenform_report_incomplete_build($missing)
{
	add_action('admin_notices', function () use ($missing) {
		if (! current_user_can('activate_plugins')) {
			return;
		}

		printf(
			'<div class="notice notice-error"><p><strong>%s</strong> %s</p></div>',
			esc_html__('Gutenform Builder could not start.', 'gutenform-builder'),
			esc_html(
				sprintf(
					/* translators: %s: what is missing from the installation, e.g. "vendor/autoload.php". */
					__('This copy is missing its build output (%s). Install the plugin from an official release package, or run "composer install --no-dev -o" and "npm install && npm run build" in the plugin directory.', 'gutenform-builder'),
					$missing
				)
			)
		);
	});
}

if (! file_exists(plugin_dir_path(__FILE__) . 'vendor/autoload.php')) {
	gutenform_report_incomplete_build('vendor/autoload.php');
	return;
}

require_once plugin_dir_path(__FILE__) . 'vendor/autoload.php';
require_once plugin_dir_path(__FILE__) . 'plugin.php';

if (! is_dir(plugin_dir_path(__FILE__) . 'assets/blocks')) {
	// PHP works, but no blocks were built -- the editor would show nothing.
	gutenform_report_incomplete_build('assets/blocks/');
}

/**
 * Initializes the Gutenform plugin when plugins are loaded.
 *
 * @since 1.0.0
 * @return void
 */
function gutenform_init()
{
	Gutenform::get_instance()->init();
}

// Hook for plugin initialization.
add_action('plugins_loaded', 'gutenform_init');

// Hook for plugin activation.
register_activation_hook(__FILE__, array(\Gutenform\Core\Install::get_instance(), 'init'));

// Clear our scheduled jobs on deactivation so they don't linger in wp_cron.
register_deactivation_hook(__FILE__, array(\Gutenform\Core\Retention::class, 'unschedule'));
