<?php

/**
 * Plugin Name: Streamery Forms
 * Plugin URI: https://github.com/streamery-de/streamery-forms
 * Description: Build forms in the block editor, collect submissions in a built-in inbox, and forward them by email or webhook.
 * Author: Streamery
 * Author URI: https://streamery.de
 * License: GPL-2.0-or-later
 * Version: 1.0.6
 * Requires at least: 6.5
 * Requires PHP: 7.4
 * Text Domain: streamery-forms
 *
 * @package StreameryForms
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
function streamery_forms_report_incomplete_build($missing)
{
	add_action('admin_notices', function () use ($missing) {
		if (! current_user_can('activate_plugins')) {
			return;
		}

		// Only where it is actionable: the Plugins screen and our own pages.
		$screen = function_exists('get_current_screen') ? get_current_screen() : null;
		if (! $screen || ('plugins' !== $screen->id && false === strpos($screen->id, 'streamery-forms'))) {
			return;
		}

		printf(
			'<div class="notice notice-error"><p><strong>%s</strong> %s</p></div>',
			esc_html__('Streamery Forms could not start.', 'streamery-forms'),
			esc_html(
				sprintf(
					/* translators: %s: what is missing from the installation, e.g. "vendor/autoload.php". */
					__('This copy is missing its build output (%s). Install the plugin from an official release package, or run "composer install --no-dev -o" and "npm install && npm run build" in the plugin directory.', 'streamery-forms'),
					$missing
				)
			)
		);
	});
}

if (! file_exists(plugin_dir_path(__FILE__) . 'vendor/autoload.php')) {
	streamery_forms_report_incomplete_build('vendor/autoload.php');
	return;
}

require_once plugin_dir_path(__FILE__) . 'vendor/autoload.php';
require_once plugin_dir_path(__FILE__) . 'plugin.php';

if (! is_dir(plugin_dir_path(__FILE__) . 'assets/blocks')) {
	// PHP works, but no blocks were built -- the editor would show nothing.
	streamery_forms_report_incomplete_build('assets/blocks/');
}

/**
 * Initializes the Streamery Forms plugin when plugins are loaded.
 *
 * @since 1.0.0
 * @return void
 */
function streamery_forms_init()
{
	StreameryForms::get_instance()->init();
}

// Hook for plugin initialization.
add_action('plugins_loaded', 'streamery_forms_init');

// Hook for plugin activation.
register_activation_hook(__FILE__, array(\StreameryForms\Core\Install::get_instance(), 'init'));

// Clear our scheduled jobs on deactivation so they don't linger in wp_cron.
register_deactivation_hook(__FILE__, array(\StreameryForms\Core\Retention::class, 'unschedule'));
