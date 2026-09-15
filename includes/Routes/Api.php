<?php

/**
 * Streamery Forms Routes
 *
 * Defines and registers custom API routes for the Streamery Forms using the Haruncpi\WpApi library.
 *
 * Every route is deny-by-default (see Libs\API\Route) -- each one below carries an explicit
 * capability check or Route::ALLOW_PUBLIC. /submit and /upload are the only two routes meant
 * to be reachable by anonymous visitors.
 *
 * @package StreameryForms\Routes
 */

namespace StreameryForms\Routes;

use StreameryForms\Core\Capabilities;
use StreameryForms\Libs\API\Route;

defined('ABSPATH') || exit;

Route::prefix(
	STREAMERY_FORMS_ROUTE_PREFIX,
	function (Route $route) {

		$view_entries    = '\StreameryForms\Core\Capabilities::can_view_entries';
		$manage_entries   = '\StreameryForms\Core\Capabilities::can_manage_entries';
		$manage_settings = '\StreameryForms\Core\Capabilities::can_manage_settings';

		// Posts routes (exposes drafts/private posts -- admin/settings only).
		$route->get('/posts/get', '\StreameryForms\Controllers\Posts\Actions@get_all_posts', $manage_settings);
		$route->get('/posts/get/{id}', '\StreameryForms\Controllers\Posts\Actions@get_post', $manage_settings);

		// Forms usage (posts with embedded forms, grouped by post type).
		$route->get('/forms/usage', '\StreameryForms\Controllers\Forms\Actions@get_usage', $manage_settings);

		// Database routes (demo data / destructive table reset).
		$route->post('/database/seed-demo', '\StreameryForms\Controllers\Database\Actions@seed_demo', $manage_settings);
		$route->get('/database/check-demo-data', '\StreameryForms\Controllers\Database\Actions@check_demo_data', $manage_settings);
		$route->post('/database/remove', '\StreameryForms\Controllers\Database\Actions@remove', $manage_settings);

		// Entries routes.
		$route->post('/entries/create', '\StreameryForms\Controllers\Entries\Actions@create', $manage_entries);
		$route->get('/entries/get', '\StreameryForms\Controllers\Entries\Actions@get', $view_entries);
		$route->get('/entries/get/{id}', '\StreameryForms\Controllers\Entries\Actions@get_single', $view_entries);
		$route->get('/entries/form-identifiers', '\StreameryForms\Controllers\Entries\Actions@get_form_identifiers', $view_entries);
		$route->get('/entries/statuses', '\StreameryForms\Controllers\Entries\Actions@get_statuses', $view_entries);
		$route->post('/entries/update', '\StreameryForms\Controllers\Entries\Actions@update', $manage_entries);
		$route->post('/entries/delete', '\StreameryForms\Controllers\Entries\Actions@delete', $manage_entries);
		$route->post('/entries/mark-read', '\StreameryForms\Controllers\Entries\Actions@mark_read', $manage_entries);
		$route->post('/entries/empty-trash', '\StreameryForms\Controllers\Entries\Actions@empty_trash', $manage_entries);
		// Exporting is reading, so it needs the view capability rather than manage.
		$route->get('/entries/export', '\StreameryForms\Controllers\Entries\Export@export', $view_entries);

		// Inbox Folders routes.
		$route->get('/inbox-folders/get', '\StreameryForms\Controllers\InboxFolders\Actions@get', $view_entries);
		$route->post('/inbox-folders/create', '\StreameryForms\Controllers\InboxFolders\Actions@create', $manage_entries);
		$route->post('/inbox-folders/update', '\StreameryForms\Controllers\InboxFolders\Actions@update', $manage_entries);
		$route->post('/inbox-folders/delete', '\StreameryForms\Controllers\InboxFolders\Actions@delete', $manage_entries);

		// Mailboxes routes (configuration -- settings only).
		$route->post('/mailboxes/create', '\StreameryForms\Controllers\Mailboxes\Actions@create', $manage_settings);
		$route->get('/mailboxes/get', '\StreameryForms\Controllers\Mailboxes\Actions@get', $manage_settings);
		$route->get('/mailboxes/get/{id}', '\StreameryForms\Controllers\Mailboxes\Actions@get_single', $manage_settings);
		$route->post('/mailboxes/update', '\StreameryForms\Controllers\Mailboxes\Actions@update', $manage_settings);
		$route->post('/mailboxes/delete', '\StreameryForms\Controllers\Mailboxes\Actions@delete', $manage_settings);

		// Providers routes (feed settings can contain credentials -- settings only).
		$route->post('/providers/create', '\StreameryForms\Controllers\Providers\Actions@create', $manage_settings);
		$route->get('/providers/get', '\StreameryForms\Controllers\Providers\Actions@get', $manage_settings);
		$route->get('/providers/get/{id}', '\StreameryForms\Controllers\Providers\Actions@get_single', $manage_settings);
		$route->get('/providers/get-by-type/{provider_type}', '\StreameryForms\Controllers\Providers\Actions@get_by_type', $manage_settings);
		$route->get('/providers/types', '\StreameryForms\Controllers\Providers\Actions@get_provider_types', $manage_settings);
		$route->post('/providers/update', '\StreameryForms\Controllers\Providers\Actions@update', $manage_settings);
		$route->post('/providers/delete', '\StreameryForms\Controllers\Providers\Actions@delete', $manage_settings);

		// Entry Labels routes.
		$route->post('/entry-labels/create', '\StreameryForms\Controllers\EntryLabels\Actions@create', $manage_entries);
		$route->get('/entry-labels/get', '\StreameryForms\Controllers\EntryLabels\Actions@get', $view_entries);
		$route->get('/entry-labels/get/{id}', '\StreameryForms\Controllers\EntryLabels\Actions@get_single', $view_entries);
		$route->post('/entry-labels/update', '\StreameryForms\Controllers\EntryLabels\Actions@update', $manage_entries);
		$route->post('/entry-labels/delete', '\StreameryForms\Controllers\EntryLabels\Actions@delete', $manage_entries);
		$route->post('/entry-labels/attach', '\StreameryForms\Controllers\EntryLabels\Actions@attach_to_entry', $manage_entries);
		$route->post('/entry-labels/detach', '\StreameryForms\Controllers\EntryLabels\Actions@detach_from_entry', $manage_entries);

		// Submission route -- the only write endpoint meant for anonymous visitors.
		// Provider selection, settings, and mail bodies are resolved server-side;
		// see Controllers\Submissions.
		$route->post('/submit', '\StreameryForms\Controllers\Submissions\Actions@submit', Route::ALLOW_PUBLIC);

		// File upload route -- must stay open for anonymous form submitters, but is
		// hardened server-side (wp_handle_upload(), MIME allowlist, upload tokens).
		// See Controllers\FileUpload\Actions.
		$route->post('/upload', '\StreameryForms\Controllers\FileUpload\Actions@upload', Route::ALLOW_PUBLIC);

		// Populated select options (public fallback when render-time filter did not run).
		$route->get('/select/populated-options', '\StreameryForms\Controllers\Select\Actions@get_populated_options', Route::ALLOW_PUBLIC);

		// Settings routes.
		$route->get('/settings/smtp', '\StreameryForms\Controllers\Settings\Actions@get_smtp_settings', $manage_settings);
		$route->post('/settings/smtp', '\StreameryForms\Controllers\Settings\Actions@save_smtp_settings', $manage_settings);
		$route->post('/settings/smtp/test', '\StreameryForms\Controllers\Settings\Actions@test_smtp_connection', $manage_settings);
		$route->get('/settings/captcha', '\StreameryForms\Controllers\Settings\Actions@get_captcha_settings', $manage_settings);
		$route->post('/settings/captcha', '\StreameryForms\Controllers\Settings\Actions@save_captcha_settings', $manage_settings);
		$route->get('/settings/debug', '\StreameryForms\Controllers\Settings\Actions@get_debug_status', $manage_settings);
		$route->post('/settings/debug', '\StreameryForms\Controllers\Settings\Actions@update_debug_status', $manage_settings);
		$route->get('/settings/skip-first-steps', '\StreameryForms\Controllers\Settings\Actions@get_skip_first_steps', $manage_settings);
		$route->post('/settings/skip-first-steps', '\StreameryForms\Controllers\Settings\Actions@update_skip_first_steps', $manage_settings);
		$route->get('/settings/charts-visible', '\StreameryForms\Controllers\Settings\Actions@get_charts_visible', $manage_settings);
		$route->post('/settings/charts-visible', '\StreameryForms\Controllers\Settings\Actions@update_charts_visible', $manage_settings);
		$route->post('/settings/support-dismissed', '\StreameryForms\Controllers\Settings\Actions@update_support_dismissed', $manage_settings);
		$route->get('/settings/admin-bar', '\StreameryForms\Controllers\Settings\Actions@get_admin_bar_enabled', $manage_settings);
		$route->post('/settings/admin-bar', '\StreameryForms\Controllers\Settings\Actions@update_admin_bar_enabled', $manage_settings);
		$route->get('/settings/delete-data-on-uninstall', '\StreameryForms\Controllers\Settings\Actions@get_delete_data_on_uninstall', $manage_settings);
		$route->post('/settings/delete-data-on-uninstall', '\StreameryForms\Controllers\Settings\Actions@update_delete_data_on_uninstall', $manage_settings);

		// Email Logs routes (recipient/subject of every submission -- settings only).
		$route->get('/email-logs/get', '\StreameryForms\Controllers\EmailLogs\Actions@get_email_logs', $manage_settings);
		$route->get('/email-logs/get/{id}', '\StreameryForms\Controllers\EmailLogs\Actions@get_email_log', $manage_settings);
		$route->post('/email-logs/delete', '\StreameryForms\Controllers\EmailLogs\Actions@delete_email_log', $manage_settings);
		$route->post('/email-logs/delete-all', '\StreameryForms\Controllers\EmailLogs\Actions@delete_all_email_logs', $manage_settings);

		// Email Templates routes.
		$route->get('/email-templates', '\StreameryForms\Controllers\EmailTemplates\Actions@get_templates', $manage_settings);
		$route->get('/email-templates/{name}', '\StreameryForms\Controllers\EmailTemplates\Actions@get_template', $manage_settings);
		$route->post('/email-templates/preview', '\StreameryForms\Controllers\EmailTemplates\Actions@preview_template', $manage_settings);

		// Allow hooks to add more custom API routes.
		do_action('streamery-forms/api', $route);
	}
);
