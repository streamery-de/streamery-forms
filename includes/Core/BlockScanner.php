<?php

/**
 * Block Scanner
 *
 * Shared recursion helpers for walking parsed block trees. Previously these
 * lived as private methods on Controllers\Forms\Actions; FormRegistry needs
 * the exact same traversal, so they're extracted here rather than duplicated.
 *
 * @package StreameryForms\Core
 * @since 1.0.0
 */

namespace StreameryForms\Core;

defined('ABSPATH') || exit;

/**
 * Class BlockScanner
 */
class BlockScanner
{
	/**
	 * Block names that count as "form fields", mapped to the field type stored
	 * in the schema.
	 *
	 * @var array<string, string>
	 */
	public const FIELD_BLOCKS = array(
		'streamery-forms/input'     => 'input',
		'streamery-forms/textarea'  => 'textarea',
		'streamery-forms/select'    => 'select',
		'streamery-forms/checkbox'  => 'checkbox',
		'streamery-forms/radio'     => 'radio',
		'streamery-forms/date-time' => 'date-time',
		'streamery-forms/slider'    => 'slider',
		'streamery-forms/file'      => 'file',
	);

	/**
	 * Recursively find all streamery-forms/form blocks in a block list.
	 *
	 * @param array $blocks Parsed blocks.
	 * @return array List of form block data (attrs + inner_blocks + field_count).
	 */
	public static function find_form_blocks(array $blocks): array
	{
		$found = array();

		foreach ($blocks as $block) {
			$name = isset($block['blockName']) ? $block['blockName'] : '';

			if ('streamery-forms/form' === $name) {
				$inner   = isset($block['innerBlocks']) ? $block['innerBlocks'] : array();
				$found[] = array(
					'attrs'        => isset($block['attrs']) ? $block['attrs'] : array(),
					'inner_blocks' => $inner,
					'field_count'  => self::count_field_blocks($inner),
				);
			}

			if (! empty($block['innerBlocks'])) {
				$found = array_merge($found, self::find_form_blocks($block['innerBlocks']));
			}
		}

		return $found;
	}

	/**
	 * Recursively count blocks that are form fields.
	 *
	 * @param array $blocks Parsed blocks.
	 * @return int
	 */
	public static function count_field_blocks(array $blocks): int
	{
		$count = 0;

		foreach ($blocks as $block) {
			$name = isset($block['blockName']) ? $block['blockName'] : '';

			if (isset(self::FIELD_BLOCKS[$name])) {
				++$count;
			}

			if (! empty($block['innerBlocks'])) {
				$count += self::count_field_blocks($block['innerBlocks']);
			}
		}

		return $count;
	}

	/**
	 * Recursively collect all core/block ref IDs found in a block list.
	 *
	 * @param array $blocks Parsed blocks.
	 * @return array<int> List of wp_block post IDs that are referenced.
	 */
	public static function find_block_refs(array $blocks): array
	{
		$refs = array();

		foreach ($blocks as $block) {
			$name = isset($block['blockName']) ? $block['blockName'] : '';

			if ('core/block' === $name && ! empty($block['attrs']['ref'])) {
				$refs[] = (int) $block['attrs']['ref'];
			}

			if (! empty($block['innerBlocks'])) {
				$refs = array_merge($refs, self::find_block_refs($block['innerBlocks']));
			}
		}

		return $refs;
	}

	/**
	 * Recursively build the server-side field schema for one form.
	 *
	 * The key of each entry is the name the field actually submits under --
	 * which for a multi-value checkbox group is "name[]", matching what the
	 * markup renders and therefore what arrives in submission_data.
	 *
	 * @param array $blocks Parsed inner blocks of a streamery-forms/form block.
	 * @return array<string, array>
	 */
	public static function extract_field_schema(array $blocks): array
	{
		$fields = array();

		foreach ($blocks as $block) {
			$block_name = isset($block['blockName']) ? $block['blockName'] : '';

			if (isset(self::FIELD_BLOCKS[$block_name])) {
				$attrs = isset($block['attrs']) ? $block['attrs'] : array();
				$name  = isset($attrs['name']) ? (string) $attrs['name'] : '';

				if ('' !== $name) {
					$field = self::build_field($block_name, $attrs, $name);
					$fields[$field['key']] = $field;
				}
			}

			if (! empty($block['innerBlocks'])) {
				// Nested fields (steps, groups, columns) merge into the same flat schema.
				$fields = array_merge($fields, self::extract_field_schema($block['innerBlocks']));
			}
		}

		return $fields;
	}

	/**
	 * Builds a single field schema entry.
	 *
	 * @param string $block_name Block name (e.g. streamery-forms/input).
	 * @param array  $attrs      Block attributes.
	 * @param string $name       Field name attribute.
	 * @return array
	 */
	private static function build_field(string $block_name, array $attrs, string $name): array
	{
		$type       = self::FIELD_BLOCKS[$block_name];
		$is_consent = ! empty($attrs['isConsent']);

		// Checkbox groups render as name[]; a consent checkbox renders as name.
		$multi = ('checkbox' === $type && ! $is_consent);
		$key   = $multi ? $name . '[]' : $name;

		$field = array(
			'key'      => $key,
			'name'     => $name,
			'type'     => $type,
			'multi'    => $multi,
			'required' => ! empty($attrs['required']),
		);

		if ('input' === $type) {
			$field['input_type'] = isset($attrs['type']) ? (string) $attrs['type'] : 'text';
		}

		// Value allowlist for the choice fields.
		if (in_array($type, array('select', 'radio', 'checkbox'), true)) {
			$field['options'] = self::extract_option_values($attrs);

			// A select whose options are populated at render time from another
			// source has no fixed allowlist we can enforce.
			if ('select' === $type && ! empty($attrs['optionsPopulated'])) {
				$field['options']            = array();
				$field['options_populated']  = true;
			}
		}

		if ('file' === $type) {
			$field['accept']     = isset($attrs['acceptTypes']) ? (string) $attrs['acceptTypes'] : '';
			$field['max_size']   = isset($attrs['maxFileSize']) ? (int) $attrs['maxFileSize'] : 0;
			$field['max_files']  = isset($attrs['maxFiles']) ? (int) $attrs['maxFiles'] : 1;
			$field['multiple']   = ! empty($attrs['multiple']);
		}

		// A field hidden by unmet conditional logic must not be treated as a
		// missing required field, so record that it is conditional.
		$field['conditional'] = ! empty($attrs['conditionalShow']);

		return $field;
	}

	/**
	 * Pulls the value allowlist out of an options attribute.
	 *
	 * @param array $attrs Block attributes.
	 * @return array<string>
	 */
	private static function extract_option_values(array $attrs): array
	{
		if (empty($attrs['options']) || ! is_array($attrs['options'])) {
			return array();
		}

		$values = array();
		foreach ($attrs['options'] as $option) {
			if (is_array($option) && isset($option['value'])) {
				$values[] = (string) $option['value'];
			}
		}

		return $values;
	}
}
