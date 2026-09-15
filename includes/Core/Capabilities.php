<?php

/**
 * Capabilities
 *
 * Defines Streamery Forms' own capabilities and the role/permission wiring around
 * them, so REST access and admin UI can move off manage_options (which
 * Administrator-only) and give Editors least-privilege access to entries.
 *
 * @package StreameryForms\Core
 * @since 1.0.0
 */

namespace StreameryForms\Core;

use StreameryForms\Traits\Base;

defined('ABSPATH') || exit;

/**
 * Class Capabilities
 */
class Capabilities
{
	use Base;

	/**
	 * View inbox entries and export them.
	 */
	public const VIEW_ENTRIES = 'streamery_forms_view_entries';

	/**
	 * Update/delete entries, manage labels and folders.
	 */
	public const MANAGE_ENTRIES = 'streamery_forms_manage_entries';

	/**
	 * Administrator-only: SMTP, provider feeds, mailboxes, debug, everything else.
	 */
	public const MANAGE_SETTINGS = 'streamery_forms_manage_settings';

	/**
	 * Bump when the capability set changes, so maybe_upgrade_roles() re-runs
	 * the grant on existing installs after a plugin update.
	 */
	public const VERSION = '1';

	/**
	 * All capabilities this plugin defines.
	 *
	 * @return array<string>
	 */
	public static function all(): array
	{
		return array(
			self::VIEW_ENTRIES,
			self::MANAGE_ENTRIES,
			self::MANAGE_SETTINGS,
		);
	}

	/**
	 * Bootstraps the map_meta_cap safety net and the idempotent role upgrade.
	 *
	 * @return void
	 */
	public function init()
	{
		add_filter('map_meta_cap', array($this, 'map_meta_cap'), 10, 4);
		add_action('admin_init', array($this, 'maybe_upgrade_roles'));
	}

	/**
	 * Ensures Administrators always pass our capability checks, even on a site
	 * that was updated without running the activation hook again (so an
	 * existing install never locks admins out after this update).
	 *
	 * @param array  $caps    Required capabilities.
	 * @param string $cap     Capability being checked.
	 * @param int    $user_id User ID.
	 * @param array  $args    Extra args.
	 * @return array
	 */
	public function map_meta_cap($caps, $cap, $user_id, $args)
	{
		if (in_array($cap, self::all(), true) && user_can($user_id, 'manage_options')) {
			return array('manage_options');
		}

		return $caps;
	}

	/**
	 * Grants capabilities to the Administrator and Editor roles.
	 *
	 * Safe to call on every activation and (via maybe_upgrade_roles) on
	 * existing installs after an update -- WP_Roles::add_cap() is a no-op
	 * once a role already has the capability.
	 *
	 * @return void
	 */
	public static function grant_role_capabilities()
	{
		$administrator = get_role('administrator');
		if ($administrator) {
			foreach (self::all() as $cap) {
				$administrator->add_cap($cap);
			}
		}

		$editor = get_role('editor');
		if ($editor) {
			$editor->add_cap(self::VIEW_ENTRIES);
			$editor->add_cap(self::MANAGE_ENTRIES);
		}
	}

	/**
	 * Runs the role grant once per capability-set version, so sites that
	 * update the plugin without deactivating/reactivating still get the new
	 * roles without re-granting on every single admin request.
	 *
	 * @return void
	 */
	public function maybe_upgrade_roles()
	{
		if (get_option('streamery_forms_capabilities_version') === self::VERSION) {
			return;
		}

		self::grant_role_capabilities();
		update_option('streamery_forms_capabilities_version', self::VERSION, false);
	}

	/**
	 * Permission callback: can view inbox entries.
	 *
	 * @return bool
	 */
	public static function can_view_entries(): bool
	{
		return current_user_can(self::VIEW_ENTRIES);
	}

	/**
	 * Permission callback: can manage (update/delete/label/file) entries.
	 *
	 * @return bool
	 */
	public static function can_manage_entries(): bool
	{
		return current_user_can(self::MANAGE_ENTRIES);
	}

	/**
	 * Permission callback: can manage plugin settings (SMTP, providers, mailboxes, debug).
	 *
	 * @return bool
	 */
	public static function can_manage_settings(): bool
	{
		return current_user_can(self::MANAGE_SETTINGS);
	}
}
