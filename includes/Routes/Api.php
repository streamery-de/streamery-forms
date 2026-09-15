<?php

/**
 * Gutenform Routes
 *
 * Defines and registers custom API routes for the Gutenform using the Haruncpi\WpApi library.
 *
 * Every route is deny-by-default (see Libs\API\Route) -- each one below carries an explicit
 * capability check or Route::ALLOW_PUBLIC. /submit and /upload are the only two routes meant
 * to be reachable by anonymous visitors.
 *
 * @package Gutenform\Routes
 */

namespace Gutenform\Routes;

use Gutenform\Core\Capabilities;
use Gutenform\Libs\API\Route;

defined('ABSPATH') || exit;

Route::prefix(
	GUTENFORM_ROUTE_PREFIX,
	function (Route $route) {

		$view_entries    = '\Gutenform\Core\Capabilities::can_view_entries';
		$manage_entries   = '\Gutenform\Core\Capabilities::can_manage_entries';
		$manage_settings = '\Gutenform\Core\Capabilities::can_manage_settings';

		// Posts routes (exposes drafts/private posts -- admin/settings only).
		$route->get('/posts/get', '\Gutenform\Controllers\Posts\Actions@get_all_posts', $manage_settings);
		$route->get('/posts/get/{id}', '\Gutenform\Controllers\Posts\Actions@get_post', $manage_settings);

		// Forms usage (posts with embedded forms, grouped by post type).
		$route->get('/forms/usage', '\Gutenform\Controllers\Forms\Actions@get_usage', $manage_settings);

		// Database routes (demo data / destructive table reset).
		$route->post('/database/seed-demo', '\Gutenform\Controllers\Database\Actions@seed_demo', $manage_settings);
		$route->get('/database/check-demo-data', '\Gutenform\Controllers\Database\Actions@check_demo_data', $manage_settings);
		$route->post('/database/remove', '\Gutenform\Controllers\Database\Actions@remove', $manage_settings);

		// Entries routes.
		$route->post('/entries/create', '\Gutenform\Controllers\Entries\Actions@create', $manage_entries);
		$route->get('/entries/get', '\Gutenform\Controllers\Entries\Actions@get', $view_entries);
		$route->get('/entries/get/{id}', '\Gutenform\Controllers\Entries\Actions@get_single', $view_entries);
		$route->get('/entries/form-identifiers', '\Gutenform\Controllers\Entries\Actions@get_form_identifiers', $view_entries);
		$route->get('/entries/statuses', '\Gutenform\Controllers\Entries\Actions@get_statuses', $view_entries);
		$route->post('/entries/update', '\Gutenform\Controllers\Entries\Actions@update', $manage_entries);
		$route->post('/entries/delete', '\Gutenform\Controllers\Entries\Actions@delete', $manage_entries);
		$route->post('/entries/mark-read', '\Gutenform\Controllers\Entries\Actions@mark_read', $manage_entries);
		$route->post('/entries/empty-trash', '\Gutenform\Controllers\Entries\Actions@empty_trash', $manage_entries);
		// Exporting is reading, so it needs the view capability rather than manage.
		$route->get('/entries/export', '\Gutenform\Controllers\Entries\Export@export', $view_entries);

		// Inbox Folders routes.
		$route->get('/inbox-folders/get', '\Gutenform\Controllers\InboxFolders\Actions@get', $view_entries);
		$route->post('/inbox-folders/create', '\Gutenform\Controllers\InboxFolders\Actions@create', $manage_entries);
		$route->post('/inbox-folders/update', '\Gutenform\Controllers\InboxFolders\Actions@update', $manage_entries);
		$route->post('/inbox-folders/delete', '\Gutenform\Controllers\InboxFolders\Actions@delete', $manage_entries);

		// Mailboxes routes (configuration -- settings only).
		$route->post('/mailboxes/create', '\Gutenform\Controllers\Mailboxes\Actions@create', $manage_settings);
		$route->get('/mailboxes/get', '\Gutenform\Controllers\Mailboxes\Actions@get', $manage_settings);
		$route->get('/mailboxes/get/{id}', '\Gutenform\Controllers\Mailboxes\Actions@get_single', $manage_settings);
		$route->post('/mailboxes/update', '\Gutenform\Controllers\Mailboxes\Actions@update', $manage_settings);
		$route->post('/mailboxes/delete', '\Gutenform\Controllers\Mailboxes\Actions@delete', $manage_settings);

		// Providers routes (feed settings can contain credentials -- settings only).
		$route->post('/providers/create', '\Gutenform\Controllers\Providers\Actions@create', $manage_settings);
		$route->get('/providers/get', '\Gutenform\Controllers\Providers\Actions@get', $manage_settings);
		$route->get('/providers/get/{id}', '\Gutenform\Controllers\Providers\Actions@get_single', $manage_settings);
		$route->get('/providers/get-by-type/{provider_type}', '\Gutenform\Controllers\Providers\Actions@get_by_type', $manage_settings);
		$route->get('/providers/types', '\Gutenform\Controllers\Providers\Actions@get_provider_types', $manage_settings);
		$route->post('/providers/update', '\Gutenform\Controllers\Providers\Actions@update', $manage_settings);
		$route->post('/providers/delete', '\Gutenform\Controllers\Providers\Actions@delete', $manage_settings);

		// Entry Labels routes.
		$route->post('/entry-labels/create', '\Gutenform\Controllers\EntryLabels\Actions@create', $manage_entries);
		$route->get('/entry-labels/get', '\Gutenform\Controllers\EntryLabels\Actions@get', $view_entries);
		$route->get('/entry-labels/get/{id}', '\Gutenform\Controllers\EntryLabels\Actions@get_single', $view_entries);
		$route->post('/entry-labels/update', '\Gutenform\Controllers\EntryLabels\Actions@update', $manage_entries);
		$route->post('/entry-labels/delete', '\Gutenform\Controllers\EntryLabels\Actions@delete', $manage_entries);
		$route->post('/entry-labels/attach', '\Gutenform\Controllers\EntryLabels\Actions@attach_to_entry', $manage_entries);
		$route->post('/entry-labels/detach', '\Gutenform\Controllers\EntryLabels\Actions@detach_from_entry', $manage_entries);

		// Submission route -- the only write endpoint meant for anonymous visitors.
		// Provider selection, settings, and mail bodies are resolved server-side;
		// see Controllers\Submissions.
		$route->post('/submit', '\Gutenform\Controllers\Submissions\Actions@submit', Route::ALLOW_PUBLIC);

		// File upload route -- must stay open for anonymous form submitters, but is
		// hardened server-side (wp_handle_upload(), MIME allowlist, upload tokens).
		// See Controllers\FileUpload\Actions.
		$route->post('/upload', '\Gutenform\Controllers\FileUpload\Actions@upload', Route::ALLOW_PUBLIC);

		// Populated select options (public fallback when render-time filter did not run).
		$route->get('/select/populated-options', '\Gutenform\Controllers\Select\Actions@get_populated_options', Route::ALLOW_PUBLIC);

		// Settings routes.
		$route->get('/settings/smtp', '\Gutenform\Controllers\Settings\Actions@get_smtp_settings', $manage_settings);
		$route->post('/settings/smtp', '\Gutenform\Controllers\Settings\Actions@save_smtp_settings', $manage_settings);
		$route->post('/settings/smtp/test', '\Gutenform\Controllers\Settings\Actions@test_smtp_connection', $manage_settings);
		$route->get('/settings/captcha', '\Gutenform\Controllers\Settings\Actions@get_captcha_settings', $manage_settings);
		$route->post('/settings/captcha', '\Gutenform\Controllers\Settings\Actions@save_captcha_settings', $manage_settings);
		$route->get('/settings/debug', '\Gutenform\Controllers\Settings\Actions@get_debug_status', $manage_settings);
		$route->post('/settings/debug', '\Gutenform\Controllers\Settings\Actions@update_debug_status', $manage_settings);
		$route->get('/settings/skip-first-steps', '\Gutenform\Controllers\Settings\Actions@get_skip_first_steps', $manage_settings);
		$route->post('/settings/skip-first-steps', '\Gutenform\Controllers\Settings\Actions@update_skip_first_steps', $manage_settings);
		$route->get('/settings/charts-visible', '\Gutenform\Controllers\Settings\Actions@get_charts_visible', $manage_settings);
		$route->post('/settings/charts-visible', '\Gutenform\Controllers\Settings\Actions@update_charts_visible', $manage_settings);
		$route->post('/settings/support-dismissed', '\Gutenform\Controllers\Settings\Actions@update_support_dismissed', $manage_settings);
		$route->get('/settings/admin-bar', '\Gutenform\Controllers\Settings\Actions@get_admin_bar_enabled', $manage_settings);
		$route->post('/settings/admin-bar', '\Gutenform\Controllers\Settings\Actions@update_admin_bar_enabled', $manage_settings);
		$route->get('/settings/delete-data-on-uninstall', '\Gutenform\Controllers\Settings\Actions@get_delete_data_on_uninstall', $manage_settings);
		$route->post('/settings/delete-data-on-uninstall', '\Gutenform\Controllers\Settings\Actions@update_delete_data_on_uninstall', $manage_settings);

		// Email Logs routes (recipient/subject of every submission -- settings only).
		$route->get('/email-logs/get', '\Gutenform\Controllers\EmailLogs\Actions@get_email_logs', $manage_settings);
		$route->get('/email-logs/get/{id}', '\Gutenform\Controllers\EmailLogs\Actions@get_email_log', $manage_settings);
		$route->post('/email-logs/delete', '\Gutenform\Controllers\EmailLogs\Actions@delete_email_log', $manage_settings);
		$route->post('/email-logs/delete-all', '\Gutenform\Controllers\EmailLogs\Actions@delete_all_email_logs', $manage_settings);

		// Email Templates routes.
		$route->get('/email-templates', '\Gutenform\Controllers\EmailTemplates\Actions@get_templates', $manage_settings);
		$route->get('/email-templates/{name}', '\Gutenform\Controllers\EmailTemplates\Actions@get_template', $manage_settings);
		$route->post('/email-templates/preview', '\Gutenform\Controllers\EmailTemplates\Actions@preview_template', $manage_settings);

		// Allow hooks to add more custom API routes.
		do_action('gutenform/api', $route);
		// Renamed in 1.0.0; the old gf_* name still fires so existing add-ons keep working.
		do_action_deprecated('gf_api', array($route), '1.0.0', 'gutenform/api');
	}
);
