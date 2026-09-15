<?php

/**
 * Form Registry
 *
 * Keeps a server-side index of every streamery-forms/form block in the site's
 * content, so the submission endpoint can resolve which provider feeds run,
 * with which settings, and what the form's field schema is -- without
 * trusting anything the submitting browser sends.
 *
 * Before this existed, src/blocks/form/save.tsx serialized providerIds and
 * providerOverrides into a data-form-options attribute on the <form>, the
 * frontend read them back out and POSTed them along, and the server used them
 * as-is. That let anyone choose which feeds fired and with what mail body.
 *
 * @package StreameryForms\Core
 * @since 1.0.0
 */

namespace StreameryForms\Core;

use StreameryForms\Models\Forms;
use StreameryForms\Providers\Registry;
use StreameryForms\Traits\Base;

defined('ABSPATH') || exit;

/**
 * Class FormRegistry
 */
class FormRegistry
{
	use Base;

	/**
	 * Registers the indexing hooks.
	 *
	 * @return void
	 */
	public function init()
	{
		add_action('save_post', array($this, 'on_save_post'), 20, 2);
		add_action('deleted_post', array($this, 'on_deleted_post'), 10, 1);
	}

	/**
	 * Re-indexes a post whenever it's saved. Covers wp_block too, so forms
	 * inside synced patterns stay indexed.
	 *
	 * @param int      $post_id Post ID.
	 * @param \WP_Post $post    Post object.
	 * @return void
	 */
	public function on_save_post($post_id, $post = null)
	{
		if (wp_is_post_revision($post_id) || wp_is_post_autosave($post_id)) {
			return;
		}

		if (! $post instanceof \WP_Post) {
			$post = get_post($post_id);
		}

		if (! $post instanceof \WP_Post) {
			return;
		}

		$this->index_post($post);
	}

	/**
	 * Drops index rows for a deleted post.
	 *
	 * @param int $post_id Post ID.
	 * @return void
	 */
	public function on_deleted_post($post_id)
	{
		try {
			Forms::where('post_id', (int) $post_id)->delete();
		} catch (\Exception $e) {
			$this->log('Failed to clean up form index for deleted post: ' . $e->getMessage());
		}
	}

	/**
	 * Parses a post's content and upserts an index row per form found.
	 *
	 * @param \WP_Post $post Post object.
	 * @return int Number of forms indexed.
	 */
	public function index_post(\WP_Post $post): int
	{
		if (false === strpos((string) $post->post_content, 'streamery-forms/form')) {
			// No forms here any more -- clear anything previously indexed for this post.
			$this->on_deleted_post($post->ID);
			return 0;
		}

		$forms = BlockScanner::find_form_blocks(parse_blocks($post->post_content));
		if (empty($forms)) {
			$this->on_deleted_post($post->ID);
			return 0;
		}

		$seen = array();

		foreach ($forms as $form) {
			$attrs           = $form['attrs'];
			$form_identifier = isset($attrs['formId']) ? (string) $attrs['formId'] : '';

			if ('' === $form_identifier) {
				continue;
			}

			$seen[] = $form_identifier;

			$config = array(
				'form_title'         => isset($attrs['formTitle']) ? (string) $attrs['formTitle'] : '',
				'mailbox_id'         => isset($attrs['mailboxId']) ? absint($attrs['mailboxId']) : 0,
				'provider_ids'       => $this->sanitize_provider_ids($attrs['providerIds'] ?? array()),
				'provider_overrides' => $this->sanitize_provider_overrides($attrs['providerOverrides'] ?? array()),
				'field_count'        => (int) $form['field_count'],
				'settings'           => $this->sanitize_form_settings($attrs['formSettings'] ?? array()),
			);

			$fields = BlockScanner::extract_field_schema($form['inner_blocks']);

			$this->upsert($form_identifier, (int) $post->ID, $config, $fields);
		}

		// Remove rows for forms that used to live in this post but no longer do.
		try {
			$stale = Forms::where('post_id', (int) $post->ID);
			if (! empty($seen)) {
				$stale = $stale->whereNotIn('form_identifier', $seen);
			}
			$stale->delete();
		} catch (\Exception $e) {
			$this->log('Failed to prune stale form index rows: ' . $e->getMessage());
		}

		return count($seen);
	}

	/**
	 * Writes (or updates) one index row.
	 *
	 * @param string $form_identifier Form identifier.
	 * @param int    $post_id         Post ID.
	 * @param array  $config          Resolved config.
	 * @param array  $fields          Field schema.
	 * @return void
	 */
	private function upsert(string $form_identifier, int $post_id, array $config, array $fields): void
	{
		try {
			$row = Forms::where('form_identifier', $form_identifier)->first();

			if (! $row) {
				$row = new Forms();
				$row->form_identifier = $form_identifier;
			}

			$row->post_id    = $post_id;
			$row->config     = $config;
			$row->fields     = $fields;
			$row->updated_at = current_time('mysql');
			$row->save();
		} catch (\Exception $e) {
			$this->log('Failed to index form "' . $form_identifier . '": ' . $e->getMessage());
		}
	}

	/**
	 * Returns the indexed configuration for a form, rebuilding it on the fly
	 * if this form has never been indexed (content migrated from an older
	 * plugin version, a widget, a template part, ...).
	 *
	 * @param string $form_identifier Form identifier.
	 * @return array|null { config: array, fields: array, post_id: int }
	 */
	public function get_form_config(string $form_identifier): ?array
	{
		if ('' === $form_identifier) {
			return null;
		}

		try {
			$row = Forms::where('form_identifier', $form_identifier)->first();
		} catch (\Exception $e) {
			$this->log('Form index lookup failed: ' . $e->getMessage());
			return null;
		}

		if (! $row) {
			$row = $this->lazy_rebuild($form_identifier);
		}

		if (! $row) {
			return null;
		}

		return array(
			'post_id' => (int) $row->post_id,
			'config'  => is_array($row->config) ? $row->config : array(),
			'fields'  => is_array($row->fields) ? $row->fields : array(),
		);
	}

	/**
	 * Finds the post containing a not-yet-indexed form and indexes it.
	 *
	 * @param string $form_identifier Form identifier.
	 * @return Forms|null
	 */
	private function lazy_rebuild(string $form_identifier)
	{
		global $wpdb;

		// Narrow to posts whose content mentions both the block and this identifier.
		$like_block = '%' . $wpdb->esc_like('streamery-forms/form') . '%';
		$like_id    = '%' . $wpdb->esc_like($form_identifier) . '%';

		$post_ids = $wpdb->get_col( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- one-shot lookup of posts containing this form; result is then indexed.
			$wpdb->prepare(
				"SELECT ID FROM {$wpdb->posts}
				 WHERE post_status NOT IN ('trash', 'auto-draft')
				 AND post_content LIKE %s
				 AND post_content LIKE %s
				 LIMIT 20",
				$like_block,
				$like_id
			)
		);

		if (empty($post_ids)) {
			return null;
		}

		foreach ($post_ids as $post_id) {
			$post = get_post((int) $post_id);
			if ($post instanceof \WP_Post) {
				$this->index_post($post);
			}
		}

		try {
			return Forms::where('form_identifier', $form_identifier)->first();
		} catch (\Exception $e) {
			return null;
		}
	}

	/**
	 * Resolves the ordered list of provider feed IDs that must run for a form.
	 *
	 * Required providers (currently the database provider) are always placed
	 * first and cannot be removed by a form's block attributes -- that's what
	 * makes the database feed a mandatory, visible feed rather than the old
	 * hardcoded special case in the submission handler.
	 *
	 * @param array $config Form config from get_form_config().
	 * @return array<int> Ordered feed IDs.
	 */
	public function resolve_provider_feed_ids(array $config): array
	{
		$configured = isset($config['provider_ids']) && is_array($config['provider_ids'])
			? array_map('absint', $config['provider_ids'])
			: array();

		$required = $this->get_required_feed_ids();

		// Required feeds first, then whatever the form configured, de-duplicated.
		$ordered = array_merge($required, $configured);
		$ordered = array_values(array_unique(array_filter($ordered)));

		return $ordered;
	}

	/**
	 * Looks up the feed IDs belonging to providers that declare themselves required.
	 *
	 * @return array<int>
	 */
	private function get_required_feed_ids(): array
	{
		$registry = Registry::get_instance();
		$slugs    = $registry->get_required_provider_slugs();

		if (empty($slugs)) {
			return array();
		}

		try {
			$feeds = \StreameryForms\Models\Providers::whereIn('provider_type', $slugs)
				->where('is_active', true)
				->orderBy('id', 'ASC')
				->get();
		} catch (\Exception $e) {
			$this->log('Failed to load required provider feeds: ' . $e->getMessage());
			return array();
		}

		$ids = array();
		foreach ($feeds as $feed) {
			$ids[] = (int) $feed->id;
		}

		return $ids;
	}

	/**
	 * Sanitizes the formSettings object attribute written by the Form Settings
	 * modal. Anything not recognised here is dropped rather than stored.
	 *
	 * @param mixed $settings Raw formSettings attribute.
	 * @return array
	 */
	private function sanitize_form_settings($settings): array
	{
		if (! is_array($settings)) {
			return array();
		}

		$spam    = is_array($settings['spamProtection'] ?? null) ? $settings['spamProtection'] : array();
		$privacy = is_array($settings['privacy'] ?? null) ? $settings['privacy'] : array();
		$advanced = is_array($settings['advanced'] ?? null) ? $settings['advanced'] : array();

		$captcha_type = (string) ($spam['captchaType'] ?? 'friendlycaptcha');
		if (! in_array($captcha_type, array('friendlycaptcha', 'recaptcha'), true)) {
			$captcha_type = 'friendlycaptcha';
		}

		$retention_days = isset($privacy['retentionDays']) ? absint($privacy['retentionDays']) : 0;

		return array(
			'spam_protection' => array(
				// Both default to on: a form that predates these settings keeps
				// the protective behaviour rather than silently losing it.
				'honeypot'     => ! isset($spam['honeypot']) || (bool) $spam['honeypot'],
				'captcha'      => ! isset($spam['captcha']) || (bool) $spam['captcha'],
				'captcha_type' => $captcha_type,
			),
			'privacy' => array(
				'store_ip'       => ! isset($privacy['storeIp']) || (bool) $privacy['storeIp'],
				// 0 means "keep forever".
				'retention_days' => $retention_days,
			),
			'advanced' => array(
				'css_class' => isset($advanced['cssClass']) ? sanitize_html_class((string) $advanced['cssClass']) : '',
			),
		);
	}

	/**
	 * @param mixed $ids Raw providerIds attribute.
	 * @return array<int>
	 */
	private function sanitize_provider_ids($ids): array
	{
		if (! is_array($ids)) {
			return array();
		}

		return array_values(array_filter(array_map('absint', $ids)));
	}

	/**
	 * Sanitizes the per-form provider overrides stored in the block.
	 *
	 * @param mixed $overrides Raw providerOverrides attribute.
	 * @return array<int, array>
	 */
	private function sanitize_provider_overrides($overrides): array
	{
		if (! is_array($overrides)) {
			return array();
		}

		$clean = array();

		foreach ($overrides as $feed_id => $override) {
			$feed_id = absint($feed_id);
			if ($feed_id <= 0 || ! is_array($override)) {
				continue;
			}

			$entry = array(
				'use_provider_layout' => isset($override['useProviderLayout'])
					? (bool) $override['useProviderLayout']
					: (isset($override['use_provider_layout']) ? (bool) $override['use_provider_layout'] : true),
				'content'             => isset($override['content']) ? wp_kses_post((string) $override['content']) : '',
			);

			$conditional = $override['conditionalShow'] ?? ($override['conditional_show'] ?? null);
			$entry['conditional_show'] = is_array($conditional) ? $conditional : null;

			// Per-feed settings overrides are validated against the provider's
			// own allow_form_override flags at execution time (see Handler).
			$settings = $override['settings'] ?? null;
			$entry['settings'] = is_array($settings) ? $settings : array();

			$clean[$feed_id] = $entry;
		}

		return $clean;
	}

	/**
	 * @param string $message Message.
	 * @return void
	 */
	private function log(string $message): void
	{
		Debug::log('Streamery Forms FormRegistry: ' . $message);
	}
}
