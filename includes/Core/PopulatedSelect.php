<?php

/**
 * Populated Select Options
 *
 * Fills streamery-forms/select fields marked with optionsPopulated via the
 * streamery-forms/select/populated_options filter at render time (and over REST
 * as a client-side fallback).
 *
 * @package StreameryForms\Core
 * @since 1.0.0
 */

namespace StreameryForms\Core;

use StreameryForms\Traits\Base;

defined('ABSPATH') || exit;

/**
 * Class PopulatedSelect
 */
class PopulatedSelect
{
	use Base;

	/**
	 * Registers render-time population.
	 *
	 * @return void
	 */
	public function init(): void
	{
		add_filter('render_block', array($this, 'render_block'), 10, 2);
	}

	/**
	 * Injects filtered options into a populated select block.
	 *
	 * @param string $block_content Rendered block HTML.
	 * @param array  $block         Parsed block data.
	 * @return string
	 */
	public function render_block(string $block_content, array $block): string
	{
		if (($block['blockName'] ?? '') !== 'streamery-forms/select') {
			return $block_content;
		}

		$attrs = $block['attrs'] ?? array();
		if (empty($attrs['optionsPopulated'])) {
			return $block_content;
		}

		$options = self::get_options(
			$attrs,
			array(
				'post_id' => (int) get_the_ID(),
				'source'  => 'render',
			)
		);

		if (empty($options)) {
			return $block_content;
		}

		return self::inject_options($block_content, $options);
	}

	/**
	 * Returns normalized options from the populated_options filter.
	 *
	 * @param array $attrs   Select block attributes.
	 * @param array $context Extra context (post_id, source, …).
	 * @return array<int, array{label: string, value: string}>
	 */
	public static function get_options(array $attrs, array $context = array()): array
	{
		$filter_context = array_merge(
			array(
				'name'        => (string) ($attrs['name'] ?? ''),
				'id'          => (string) ($attrs['id'] ?? ''),
				'label'       => (string) ($attrs['label'] ?? ''),
				'placeholder' => (string) ($attrs['placeholder'] ?? ''),
				'attributes'  => $attrs,
				'post_id'     => isset($context['post_id']) ? (int) $context['post_id'] : 0,
				'source'      => (string) ($context['source'] ?? 'render'),
			),
			$context
		);

		/**
		 * Provide options for a populated select field.
		 *
		 * @param array $options Array of ['label' => string, 'value' => string].
		 * @param array $context Field context (name, id, label, placeholder, attributes, post_id, source).
		 */
		$options = apply_filters('streamery-forms/select/populated_options', array(), $filter_context);

		return self::normalize_options($options);
	}

	/**
	 * @param mixed $options Raw filter return value.
	 * @return array<int, array{label: string, value: string}>
	 */
	public static function normalize_options($options): array
	{
		if (! is_array($options)) {
			return array();
		}

		$normalized = array();

		foreach ($options as $option) {
			if (! is_array($option)) {
				continue;
			}

			$label = isset($option['label']) ? (string) $option['label'] : '';
			$value = isset($option['value']) ? (string) $option['value'] : '';

			if ('' === $label && '' === $value) {
				continue;
			}

			$normalized[] = array(
				'label' => '' !== $label ? $label : $value,
				'value' => '' !== $value ? $value : $label,
			);
		}

		return $normalized;
	}

	/**
	 * Appends <option> elements before </select>.
	 *
	 * @param string                                                            $html    Block HTML.
	 * @param array<int, array{label: string, value: string}> $options Normalized options.
	 * @return string
	 */
	public static function inject_options(string $html, array $options): string
	{
		$options_html = '';

		foreach ($options as $option) {
			$options_html .= sprintf(
				'<option value="%s">%s</option>',
				esc_attr($option['value']),
				esc_html($option['label'])
			);
		}

		if ('' === $options_html) {
			return $html;
		}

		$updated = preg_replace(
			'/(<select\b[^>]*\bdata-populated="true"[^>]*>)(.*?)(<\/select>)/is',
			'$1$2' . $options_html . '$3',
			$html,
			1,
			$count
		);

		return ($count > 0 && is_string($updated)) ? $updated : $html;
	}

	/**
	 * Finds a field block's attributes by its submit name.
	 *
	 * @param array  $blocks     Parsed blocks.
	 * @param string $block_name Block name (e.g. streamery-forms/select).
	 * @param string $field_name Field name attribute.
	 * @return array|null
	 */
	public static function find_field_block_by_name(array $blocks, string $block_name, string $field_name): ?array
	{
		foreach ($blocks as $block) {
			if (($block['blockName'] ?? '') === $block_name) {
				$attrs = $block['attrs'] ?? array();
				if (($attrs['name'] ?? '') === $field_name) {
					return $attrs;
				}
			}

			if (! empty($block['innerBlocks'])) {
				$found = self::find_field_block_by_name($block['innerBlocks'], $block_name, $field_name);
				if (null !== $found) {
					return $found;
				}
			}
		}

		return null;
	}
}
