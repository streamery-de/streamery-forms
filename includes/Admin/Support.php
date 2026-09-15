<?php

namespace StreameryForms\Admin;

use StreameryForms\Models\Entries;
use StreameryForms\Traits\Base;

defined('ABSPATH') || exit;

/**
 * Class Support
 *
 * "Support Streamery Forms" links (Ko-fi, GitHub Sponsors, review) for the plugins
 * list and the admin app. Only plain outbound links -- nothing is loaded from
 * the donation platforms, nothing is shown on the frontend, and the prompts
 * inside the app can be dismissed for good.
 *
 * @package StreameryForms\Admin
 */
class Support
{

	use Base;

	/**
	 * User meta key for a dismissed support prompt.
	 *
	 * @var string
	 */
	const DISMISSED_META_KEY = 'streamery_forms_support_dismissed';

	/**
	 * Number of stored entries after which the inbox shows the support prompt.
	 *
	 * @var int
	 */
	const MILESTONE_ENTRIES = 50;

	/**
	 * Initialize hooks.
	 *
	 * @return void
	 */
	public function init()
	{
		add_filter('plugin_row_meta', array($this, 'plugin_row_meta'), 10, 2);
	}

	/**
	 * Support links, keyed by platform. Empty values are not rendered anywhere.
	 *
	 * @return array<string, string>
	 */
	public static function get_links(): array
	{
		$links = array(
			'kofi'           => 'https://ko-fi.com/gutenform',
			// Stays empty until the GitHub Sponsors profile is approved.
			'githubSponsors' => '',
			'review'         => 'https://wordpress.org/support/plugin/streamery-forms/reviews/#new-post',
		);

		/**
		 * Filters the support links. Return an empty array to hide every
		 * support prompt, e.g. on client sites.
		 *
		 * @param array<string, string> $links Support links keyed by platform.
		 */
		$links = apply_filters('streamery-forms/support_links', $links);

		return array_filter(array_map('esc_url_raw', (array) $links));
	}

	/**
	 * Adds the support links below the plugin description on the plugins screen.
	 *
	 * @param array  $meta        Row meta links.
	 * @param string $plugin_file Plugin basename.
	 * @return array
	 */
	public function plugin_row_meta($meta, $plugin_file)
	{
		if (plugin_basename(STREAMERY_FORMS_PLUGIN_FILE) !== $plugin_file) {
			return $meta;
		}

		$links = self::get_links();
		$items = array(
			'kofi'   => '&hearts; ' . esc_html__('Support on Ko-fi', 'streamery-forms'),
			'review' => '&#9733; ' . esc_html__('Rate Streamery Forms', 'streamery-forms'),
		);

		foreach ($items as $key => $label) {
			if (empty($links[$key])) {
				continue;
			}

			$meta[] = sprintf(
				'<a href="%s" target="_blank" rel="noopener noreferrer">%s</a>',
				esc_url($links[$key]),
				$label
			);
		}

		return $meta;
	}

	/**
	 * Whether the current user dismissed the support prompt.
	 *
	 * @return bool
	 */
	public static function is_dismissed(): bool
	{
		return (bool) get_user_meta(get_current_user_id(), self::DISMISSED_META_KEY, true);
	}

	/**
	 * Whether enough entries were collected to show the milestone prompt.
	 *
	 * @return bool
	 */
	public static function milestone_reached(): bool
	{
		try {
			return (int) Entries::count() >= self::MILESTONE_ENTRIES;
		} catch (\Exception $e) {
			return false;
		}
	}

	/**
	 * Data for the admin app and the block editor.
	 *
	 * @return array
	 */
	public static function get_script_data(): array
	{
		// Localized once per editor script handle; the entry count only needs
		// to run once per request.
		static $data = null;
		if (null !== $data) {
			return $data;
		}

		$links = self::get_links();
		// Prompts are for the people who run the site, not for editors.
		$dismissed = empty($links)
			|| !\StreameryForms\Core\Capabilities::can_manage_settings()
			|| self::is_dismissed();

		$data = array(
			'links'            => (object) $links,
			'dismissed'        => $dismissed,
			// Skip the count query when the prompt will not be shown anyway.
			'milestoneReached' => !$dismissed && self::milestone_reached(),
			'milestoneEntries' => self::MILESTONE_ENTRIES,
		);

		return $data;
	}
}
