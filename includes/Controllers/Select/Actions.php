<?php

/**
 * Select field REST actions.
 *
 * @package StreameryForms\Controllers\Select
 * @since 1.0.0
 */

namespace StreameryForms\Controllers\Select;

use StreameryForms\Core\BlockScanner;
use StreameryForms\Core\PopulatedSelect;

defined('ABSPATH') || exit;

/**
 * Class Actions
 */
class Actions
{
	/**
	 * Returns populated options for a select field (client-side fallback).
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_populated_options(\WP_REST_Request $request)
	{
		$field_name = sanitize_text_field((string) $request->get_param('field_name'));
		$post_id    = (int) $request->get_param('post_id');

		if ('' === $field_name || $post_id <= 0) {
			return new \WP_Error(
				'streamery_forms_invalid_params',
				__('field_name and post_id are required.', 'streamery-forms'),
				array('status' => 400)
			);
		}

		$post = get_post($post_id);
		if (! $post instanceof \WP_Post || ! is_post_publicly_viewable($post)) {
			return new \WP_Error(
				'streamery_forms_post_not_found',
				__('Post not found.', 'streamery-forms'),
				array('status' => 404)
			);
		}

		$attrs = PopulatedSelect::find_field_block_by_name(
			parse_blocks($post->post_content),
			'streamery-forms/select',
			$field_name
		);

		if (null === $attrs || empty($attrs['optionsPopulated'])) {
			return new \WP_Error(
				'streamery_forms_not_populated_select',
				__('This field is not a populated select.', 'streamery-forms'),
				array('status' => 404)
			);
		}

		$options = PopulatedSelect::get_options(
			$attrs,
			array(
				'post_id' => $post_id,
				'source'  => 'rest',
			)
		);

		return rest_ensure_response(
			array(
				'options' => $options,
			)
		);
	}
}
