<?php

/**
 * Uninstall the plugin.
 *
 * Runs only when the user deletes the plugin from the Plugins screen, never on
 * deactivation. Destructive cleanup is opt-in: unless the site explicitly asked
 * for its data to be removed (Streamery Forms → Settings), the tables and uploads are
 * left completely alone, so deleting and reinstalling the plugin does not throw
 * away someone's form submissions.
 *
 * @package StreameryForms
 * @subpackage Database
 */

if (! defined('WP_UNINSTALL_PLUGIN')) {
	exit;
}

/**
 * Options this plugin creates. Removed on every uninstall, including the
 * non-opt-in path: they are small, plugin-internal, and one of them holds the
 * SMTP password, which must not survive a deletion.
 *
 * @var array<string>
 */
$streamery_forms_options = array(
	'streamery_forms_smtp_settings',
	'streamery_forms_captcha_settings',
	'streamery_forms_debug_enabled',
	'streamery_forms_admin_bar_enabled',
	'streamery_forms_skin',
	'streamery_forms_db_version',
	'streamery_forms_capabilities_version',
	'streamery_forms_delete_data_on_uninstall',
	// Removed in 1.0.0, cleaned up here for sites upgrading from an older build.
	'streamery_forms_use_provider_system',
);

/**
 * User meta keys this plugin creates.
 *
 * @var array<string>
 */
$streamery_forms_user_meta = array(
	'streamery_forms_skip_first_steps',
	'streamery_forms_charts_visible',
);

$streamery_forms_delete_data = (bool) get_option('streamery_forms_delete_data_on_uninstall', false);

global $wpdb;

if ($streamery_forms_delete_data) {
	// Tables, newest/most dependent first.
	$streamery_forms_tables = array(
		'streamery_forms_forms',
		'streamery_forms_email_logs',
		'streamery_forms_entry_label_rel',
		'streamery_forms_entry_labels',
		'streamery_forms_inbox_folders',
		'streamery_forms_entries',
		'streamery_forms_providers',
		'streamery_forms_mailboxes',
	);

	foreach ($streamery_forms_tables as $streamery_forms_table) {
		// Table names cannot be bound as prepared-statement parameters, and these
		// are internal constants rather than user input.
		$wpdb->query('DROP TABLE IF EXISTS `' . esc_sql($wpdb->prefix . $streamery_forms_table) . '`'); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange, PluginCheck.Security.DirectDB.UnescapedDBParameter
	}

	// Uploaded form attachments (wp-content/uploads/streamery-forms/).
	$streamery_forms_upload_dir = wp_upload_dir();
	$streamery_forms_base       = trailingslashit($streamery_forms_upload_dir['basedir']) . 'streamery-forms';

	if (is_dir($streamery_forms_base)) {
		require_once ABSPATH . 'wp-admin/includes/file.php';
		if (WP_Filesystem()) {
			global $wp_filesystem;
			$wp_filesystem->delete($streamery_forms_base, true);
		}
	}
}

// Options and user meta always go, regardless of the opt-in.
foreach ($streamery_forms_options as $streamery_forms_option) {
	delete_option($streamery_forms_option);
}

foreach ($streamery_forms_user_meta as $streamery_forms_meta_key) {
	delete_metadata('user', 0, $streamery_forms_meta_key, '', true);
}

// Custom capabilities added to roles.
$streamery_forms_caps = array(
	'streamery_forms_view_entries',
	'streamery_forms_manage_entries',
	'streamery_forms_manage_settings',
);

foreach (array('administrator', 'editor') as $streamery_forms_role_name) {
	$streamery_forms_role = get_role($streamery_forms_role_name);
	if (! $streamery_forms_role) {
		continue;
	}
	foreach ($streamery_forms_caps as $streamery_forms_cap) {
		$streamery_forms_role->remove_cap($streamery_forms_cap);
	}
}

// Scheduled jobs.
$streamery_forms_timestamp = wp_next_scheduled('streamery_forms_purge_expired_entries');
if ($streamery_forms_timestamp) {
	wp_unschedule_event($streamery_forms_timestamp, 'streamery_forms_purge_expired_entries');
}

// Transients created by the upload-token store and the submission rate limiter.
$wpdb->query( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- deleting this plugin's transients on uninstall.
	$wpdb->prepare(
		"DELETE FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s",
		$wpdb->esc_like('_transient_streamery_forms_') . '%',
		$wpdb->esc_like('_transient_timeout_streamery_forms_') . '%'
	)
);
