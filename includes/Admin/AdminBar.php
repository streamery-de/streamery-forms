<?php

namespace StreameryForms\Admin;

use StreameryForms\Models\Entries;
use StreameryForms\Models\Mailboxes;
use StreameryForms\Traits\Base;

defined('ABSPATH') || exit;

/**
 * Class AdminBar
 *
 * Adds a Streamery Forms node to the WordPress admin bar with an unread
 * entries count bubble and a dropdown listing all mailboxes + settings.
 *
 * @package StreameryForms\Admin
 * @since   1.1.0
 */
class AdminBar
{

	use Base;

	/**
	 * Option key used to persist the admin-bar visibility setting.
	 *
	 * @var string
	 */
	const OPTION_KEY = 'streamery_forms_admin_bar_enabled';

	/**
	 * Initialize hooks.
	 *
	 * @return void
	 */
	public function init()
	{
		// Only proceed when the user can manage options and the feature is enabled.
		if (!current_user_can('manage_options')) {
			return;
		}

		if (!self::is_enabled()) {
			return;
		}

		add_action('admin_bar_menu', array($this, 'add_admin_bar_menu'), 100);
		// Must run on the enqueue hooks, not wp_head/admin_head: by the time
		// those fire, styles have already been printed and an inline style
		// added there would never be output.
		add_action('wp_enqueue_scripts', array($this, 'render_styles'));
		add_action('admin_enqueue_scripts', array($this, 'render_styles'));
	}

	/**
	 * Check whether the admin bar feature is enabled. Opt-in (default: false).
	 *
	 * @return bool
	 */
	public static function is_enabled(): bool
	{
		return (bool) get_option(self::OPTION_KEY, false);
	}

	/**
	 * Build the admin bar node tree.
	 *
	 * @param \WP_Admin_Bar $wp_admin_bar WordPress admin bar instance.
	 *
	 * @return void
	 */
	public function add_admin_bar_menu($wp_admin_bar)
	{
		$unread_count = $this->get_unread_count();

		// Build the title with optional bubble.
		$title = '<span class="ab-icon dashicons dashicons-email"></span>';
		$title .= '<span class="ab-label">' . esc_html__('Streamery Forms', 'streamery-forms') . '</span>';

		if ($unread_count > 0) {
			$display_count = $unread_count > 99 ? '99+' : $unread_count;
			$title .= '<span class="gf-admin-bar-bubble">' . esc_html($display_count) . '</span>';
		}

		// Top-level node.
		$wp_admin_bar->add_node(array(
			'id'    => 'streamery-forms',
			'title' => $title,
			'href'  => admin_url('admin.php?page=streamery-forms#/inbox'),
			'meta'  => array(
				'class' => 'streamery-forms-admin-bar-node',
			),
		));

		// Dropdown: Mailboxes.
		$mailboxes = $this->get_mailboxes();

		foreach ($mailboxes as $mailbox) {
			$mailbox_unread = $this->get_unread_count_for_mailbox($mailbox->id);
			$mailbox_title  = esc_html($mailbox->title);

			if ($mailbox_unread > 0) {
				$mailbox_title .= ' <span class="gf-admin-bar-count">(' . esc_html($mailbox_unread) . ')</span>';
			}

			$wp_admin_bar->add_node(array(
				'id'     => 'streamery-forms-mailbox-' . $mailbox->id,
				'parent' => 'streamery-forms',
				'title'  => $mailbox_title,
				'href'   => admin_url('admin.php?page=streamery-forms#/inbox?mailbox=' . $mailbox->id),
			));
		}

		// Separator (visual divider via empty group).
		$wp_admin_bar->add_node(array(
			'id'     => 'streamery-forms-separator',
			'parent' => 'streamery-forms',
			'title'  => '<hr style="margin:4px 0;border:0;border-top:1px solid rgba(255,255,255,.15);">',
			'meta'   => array(
				'class' => 'streamery-forms-admin-bar-separator',
			),
		));

		// Dropdown: Settings.
		$wp_admin_bar->add_node(array(
			'id'     => 'streamery-forms-settings',
			'parent' => 'streamery-forms',
			'title'  => esc_html__('Settings', 'streamery-forms'),
			'href'   => admin_url('admin.php?page=streamery-forms-settings#/settings'),
		));
	}

	/**
	 * Get total unread entry count.
	 *
	 * @return int
	 */
	private function get_unread_count(): int
	{
		try {
			return (int) Entries::where('is_read', 0)
				->where('status', 'inbox')
				->count();
		} catch (\Exception $e) {
			return 0;
		}
	}

	/**
	 * Get unread entry count for a specific mailbox.
	 *
	 * @param int $mailbox_id Mailbox ID.
	 *
	 * @return int
	 */
	private function get_unread_count_for_mailbox(int $mailbox_id): int
	{
		try {
			return (int) Entries::where('is_read', 0)
				->where('status', 'inbox')
				->where('mailbox_id', $mailbox_id)
				->count();
		} catch (\Exception $e) {
			return 0;
		}
	}

	/**
	 * Retrieve all mailboxes.
	 *
	 * @return \Illuminate\Database\Eloquent\Collection
	 */
	private function get_mailboxes()
	{
		try {
			return Mailboxes::orderBy('title', 'asc')->get();
		} catch (\Exception $e) {
			return collect();
		}
	}

	/**
	 * Render inline CSS for the admin bar bubble and icon.
	 *
	 * @return void
	 */
	public function render_styles()
	{
		// Registered against a (style-less) handle and attached with
		// wp_add_inline_style() rather than echoed as a raw <style> block, so the
		// CSS goes through WordPress' own enqueue pipeline -- required for the
		// WordPress.org review, and it means the styles can be dequeued.
		$handle = 'streamery-forms-admin-bar';

		if (! wp_style_is($handle, 'registered')) {
			wp_register_style($handle, false, array(), STREAMERY_FORMS_VERSION);
		}

		if (! wp_style_is($handle, 'enqueued')) {
			wp_enqueue_style($handle);
			wp_add_inline_style($handle, self::get_styles());
		}
	}

	/**
	 * The admin bar CSS.
	 *
	 * @return string
	 */
	private static function get_styles(): string
	{
		return '/* Streamery Forms Admin Bar */
#wpadminbar .streamery-forms-admin-bar-node .ab-icon.dashicons {
    font-size: 18px !important;
    line-height: 1.3 !important;
    width: 20px !important;
    height: 20px !important;
    margin-right: 4px !important;
}

#wpadminbar .streamery-forms-admin-bar-node .ab-icon.dashicons::before {
    font-size: 18px !important;
    line-height: 1.3 !important;
}

#wpadminbar .streamery-forms-admin-bar-node > .ab-item {
    display: flex !important;
    align-items: center !important;
}

/* Unread bubble */
#wpadminbar .gf-admin-bar-bubble {
    display: inline-block;
    background: #d63638;
    color: #fff;
    font-size: 10px;
    font-weight: 600;
    line-height: 1;
    min-width: 16px;
    height: 16px;
    padding: 3px 5px;
    border-radius: 10px;
    text-align: center;
    margin-left: 6px;
    vertical-align: middle;
    box-sizing: border-box;
}

/* Mailbox unread count in dropdown */
#wpadminbar .gf-admin-bar-count {
    opacity: .7;
    font-size: 12px;
}

/* Separator */
#wpadminbar .streamery-forms-admin-bar-separator > .ab-item {
    height: auto !important;
    padding: 0 10px !important;
    cursor: default !important;
}

#wpadminbar .streamery-forms-admin-bar-separator > .ab-item:hover {
    background: none !important;
    color: inherit !important;
}';
	}
}
