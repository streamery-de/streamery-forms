<?php

namespace StreameryForms\Admin;

use StreameryForms\Traits\Base;

defined('ABSPATH') || exit;

/**
 * Class Menu
 *
 * Represents the admin menu management for the Streamery Forms plugin.
 *
 * @package StreameryForms\Admin
 */
class Menu
{

	use Base;

	/**
	 * Parent slug for the menu.
	 *
	 * @var string
	 */
	private $parent_slug = 'streamery-forms';

	/**
	 * Initializes the admin menu.
	 *
	 * @return void
	 */
	public function init()
	{
		// Hook the function to the admin menu.
		add_action('admin_menu', array($this, 'menu'));
	}

	/**
	 * Adds a menu to the WordPress admin dashboard.
	 *
	 * @return void
	 */
	public function menu()
	{

		add_menu_page(
			__('Streamery Forms', 'streamery-forms'),
			__('Streamery Forms', 'streamery-forms'),
			'manage_options',
			$this->parent_slug,
			array($this, 'admin_page'),
			'dashicons-email'
		);

		$settings_slug = $this->parent_slug . '-settings';
		$forms_usage_slug = $this->parent_slug . '-forms-usage';

		$submenu_pages = array(
			array(
				'parent_slug' => $this->parent_slug,
				'page_title'  => __('Inbox', 'streamery-forms'),
				'menu_title'  => __('Inbox', 'streamery-forms'),
				'capability'  => 'manage_options',
				'menu_slug'   => $this->parent_slug,
				'function'    => array($this, 'admin_page'),
			),
			array(
				'parent_slug' => $this->parent_slug,
				'page_title'  => __('Forms', 'streamery-forms'),
				'menu_title'  => __('Forms', 'streamery-forms'),
				'capability'  => 'manage_options',
				'menu_slug'   => $forms_usage_slug,
				'function'    => array($this, 'admin_page'),
			),
			array(
				'parent_slug' => $this->parent_slug,
				'page_title'  => __('Settings', 'streamery-forms'),
				'menu_title'  => __('Settings', 'streamery-forms'),
				'capability'  => 'manage_options',
				'menu_slug'   => $settings_slug,
				'function'    => array($this, 'admin_page'),
			),
		);

		$plugin_submenu_pages = apply_filters('streamery-forms/submenu_pages', $submenu_pages);
		foreach ($plugin_submenu_pages as $submenu) {

			add_submenu_page(
				$submenu['parent_slug'],
				$submenu['page_title'],
				$submenu['menu_title'],
				$submenu['capability'],
				$submenu['menu_slug'],
				$submenu['function']
			);
		}
	}

	/**
	 * Callback function for the main "MyPlugin" menu page.
	 *
	 * @return void
	 */
	public function admin_page()
	{
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- admin menu router; capability already required by add_menu_page.
		$page = isset($_GET['page']) ? sanitize_text_field(wp_unslash($_GET['page'])) : '';
		$settings_slug = $this->parent_slug . '-settings';
		$forms_usage_slug = $this->parent_slug . '-forms-usage';

		// Set the default hash route for the SPA when the page is opened without
		// one. Printed via wp_print_inline_script_tag() rather than a raw echo so
		// WordPress can apply its script attributes/filters (and so this passes
		// the WP.org review's escaping checks).
		$default_route = '';
		if ($page === $settings_slug) {
			$default_route = '#/settings';
		} elseif ($page === $forms_usage_slug) {
			$default_route = '#/forms-usage';
		}

		if ('' !== $default_route) {
			// Preserves deeper routes like #/settings/providers on reload.
			wp_print_inline_script_tag(
				sprintf(
					'(function(){var r=%s;var h=window.location.hash;if(!h||h==="#"||h==="#/"||h.indexOf(r)!==0){window.location.hash=r;}})();',
					wp_json_encode($default_route)
				)
			);
		}
?>
		<div id="myplugin" class="myplugin-app"></div>
<?php
	}
}
