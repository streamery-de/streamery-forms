<?php

/**
 * Class Actions
 *
 * Handles form usage overview: posts that contain embedded Streamery Forms blocks.
 *
 * @package StreameryForms\Controllers\Forms
 * @since 1.0.0
 */

namespace StreameryForms\Controllers\Forms;

use StreameryForms\Core\BlockScanner;
use StreameryForms\Models\Mailboxes;
use StreameryForms\Models\Providers;

defined('ABSPATH') || exit;

/**
 * Class Actions
 *
 * Handles form usage and overview actions.
 *
 * @package StreameryForms\Controllers\Forms
 */
class Actions
{

	/**
	 * Build a map of wp_block ID => list of posts that reference it (post_id, post_title, post_type, edit_link, view_link).
	 * Only considers post types that are not wp_block.
	 *
	 * @param array $post_types List of post type names (including wp_block).
	 * @return array<int, array{array{post_id: int, post_title: string, post_type: string, edit_link: string, view_link: string}}>
	 */
	private function build_block_usage_map(array $post_types)
	{
		$other_types = array_diff($post_types, array('wp_block'));
		if (empty($other_types)) {
			return array();
		}

		$posts = get_posts(array(
			'post_type'      => $other_types,
			'post_status'    => array('publish', 'draft', 'private', 'pending'),
			'posts_per_page' => -1,
			'no_found_rows'  => true,
		));

		$map = array();
		foreach ($posts as $post) {
			$blocks = parse_blocks($post->post_content);
			$refs = BlockScanner::find_block_refs($blocks);
			$refs = array_unique($refs);
			$edit_link = get_edit_post_link($post->ID, 'raw');
			$view_link = get_permalink($post->ID);
			$entry = array(
				'post_id'    => $post->ID,
				'post_title' => $post->post_title ? $post->post_title : '',
				'post_type'  => $post->post_type,
				'edit_link'  => $edit_link ? $edit_link : '',
				'view_link'  => $view_link ? $view_link : '',
			);
			foreach ($refs as $ref_id) {
				if (!isset($map[$ref_id])) {
					$map[$ref_id] = array();
				}
				$map[$ref_id][] = $entry;
			}
		}
		return $map;
	}

	/**
	 * Get all posts that contain at least one streamery-forms/form block, grouped by post type.
	 *
	 * @param \WP_REST_Request $request The REST request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_usage(\WP_REST_Request $request)
	{
		$post_types = get_post_types(array('public' => true), 'names');
		$post_types['page'] = 'page';
		// Include wp_block (WordPress Patterns / Synced patterns / Reusable blocks).
		if (post_type_exists('wp_block')) {
			$post_types['wp_block'] = 'wp_block';
		}
		$post_types = array_unique(array_values($post_types));

		$posts = get_posts(array(
			'post_type'      => $post_types,
			'post_status'    => array('publish', 'draft', 'private', 'pending'),
			'posts_per_page' => -1,
			'no_found_rows'  => true,
			'orderby'        => 'post_type title',
			'order'          => 'ASC',
		));

		$mailbox_map = array();
		$provider_map = array();
		try {
			$mailboxes = Mailboxes::all();
			foreach ($mailboxes as $m) {
				$mailbox_map[(string) $m->id] = $m->title;
			}
			$providers = Providers::all();
			foreach ($providers as $p) {
				$provider_map[(string) $p->id] = $p->name;
			}
		} catch (\Exception $e) {
			// Tables may not exist; continue with empty maps.
		}

		$by_post_type = array();
		foreach ($posts as $post) {
			if (strpos($post->post_content, 'streamery-forms/form') === false) {
				continue;
			}
			$blocks = parse_blocks($post->post_content);
			$forms = BlockScanner::find_form_blocks($blocks);
			if (empty($forms)) {
				continue;
			}

			$post_type = $post->post_type;
			$post_type_obj = get_post_type_object($post_type);
			$post_type_label = $post_type_obj ? $post_type_obj->labels->singular_name : $post_type;

			if (!isset($by_post_type[$post_type])) {
				$by_post_type[$post_type] = array(
					'label' => $post_type_label,
					'posts' => array(),
				);
			}

			$edit_link = get_edit_post_link($post->ID, 'raw');
			$view_link = get_permalink($post->ID);

			foreach ($forms as $form) {
				$attrs = $form['attrs'];
				$form_id = isset($attrs['formId']) ? $attrs['formId'] : '';
				$form_title = isset($attrs['formTitle']) ? $attrs['formTitle'] : '';
				$mailbox_id = isset($attrs['mailboxId']) ? $attrs['mailboxId'] : '1';
				$provider_ids = isset($attrs['providerIds']) && is_array($attrs['providerIds']) ? $attrs['providerIds'] : array();

				$mailbox_title = isset($mailbox_map[$mailbox_id]) ? $mailbox_map[$mailbox_id] : $mailbox_id;
				$provider_names = array();
				foreach ($provider_ids as $pid) {
					$provider_names[] = isset($provider_map[(string) $pid]) ? $provider_map[(string) $pid] : (string) $pid;
				}

				$by_post_type[$post_type]['posts'][] = array(
					'post_id'        => $post->ID,
					'post_title'     => $post->post_title,
					'form_id'        => $form_id,
					'form_title'     => $form_title,
					'mailbox'        => $mailbox_title,
					'mailbox_id'     => $mailbox_id,
					'providers'      => implode(', ', $provider_names),
					'provider_ids'   => $provider_ids,
					'field_count'    => $form['field_count'],
					'edit_link'      => $edit_link ? $edit_link : '',
					'view_link'      => $view_link ? $view_link : '',
				);
			}
		}

		// For wp_block (patterns): add where each pattern is used.
		if (isset($by_post_type['wp_block']) && !empty($by_post_type['wp_block']['posts'])) {
			$block_usage_map = $this->build_block_usage_map($post_types);
			foreach ($by_post_type['wp_block']['posts'] as $idx => $row) {
				$block_id = $row['post_id'];
				$by_post_type['wp_block']['posts'][$idx]['used_in'] = isset($block_usage_map[$block_id])
					? $block_usage_map[$block_id]
					: array();
			}
		}

		// Sort post types by label.
		uasort($by_post_type, function ($a, $b) {
			return strcasecmp($a['label'], $b['label']);
		});

		return rest_ensure_response(array(
			'by_post_type' => $by_post_type,
		));
	}
}
