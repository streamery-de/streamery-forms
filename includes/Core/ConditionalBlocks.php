<?php
/**
 * Conditional logic for any block inside a form
 *
 * Streamery Forms' own field and step blocks write data-conditional-show in
 * their save markup. Every other block (groups, headings, columns, …) gets the
 * conditionalShow attribute registered here and the data attribute injected at
 * render time, so the frontend evaluates it like a field -- without touching
 * those blocks' saved markup.
 *
 * @package StreameryForms\Core
 */

declare(strict_types=1);

namespace StreameryForms\Core;

use StreameryForms\Traits\Base;

defined('ABSPATH') || exit;

/**
 * Class ConditionalBlocks
 */
class ConditionalBlocks
{
	use Base;

	/**
	 * Registers the hooks.
	 *
	 * @return void
	 */
	public function init(): void
	{
		add_filter('register_block_type_args', array($this, 'register_attribute'), 10, 2);
		add_filter('render_block', array($this, 'render_block'), 10, 2);
	}

	/**
	 * Whether a block gets its conditional logic from here. Streamery Forms'
	 * own blocks either handle it in their save markup or don't support it.
	 *
	 * @param string $block_name Block name.
	 * @return bool
	 */
	public static function applies_to(string $block_name): bool
	{
		return '' !== $block_name && 0 !== strpos($block_name, 'streamery-forms/');
	}

	/**
	 * Adds the conditionalShow attribute to every applicable server-registered
	 * block, so dynamic blocks accept it (e.g. in server-side render previews).
	 *
	 * @param array  $args       Block type arguments.
	 * @param string $block_name Block name.
	 * @return array
	 */
	public function register_attribute(array $args, string $block_name): array
	{
		if (! self::applies_to($block_name)) {
			return $args;
		}

		if (! isset($args['attributes']) || ! is_array($args['attributes'])) {
			$args['attributes'] = array();
		}

		if (! isset($args['attributes']['conditionalShow'])) {
			$args['attributes']['conditionalShow'] = array('type' => 'object');
		}

		return $args;
	}

	/**
	 * Writes data-conditional-show onto the block's outermost element.
	 *
	 * @param string $block_content Rendered block HTML.
	 * @param array  $block         Parsed block data.
	 * @return string
	 */
	public function render_block(string $block_content, array $block): string
	{
		if ('' === trim($block_content) || ! self::applies_to((string) ($block['blockName'] ?? ''))) {
			return $block_content;
		}

		$conditional_show = $block['attrs']['conditionalShow'] ?? null;
		if (! self::has_conditions($conditional_show)) {
			return $block_content;
		}

		$processor = new \WP_HTML_Tag_Processor($block_content);
		if (! $processor->next_tag() || null !== $processor->get_attribute('data-conditional-show')) {
			return $block_content;
		}

		$processor->set_attribute('data-conditional-show', (string) wp_json_encode($conditional_show));

		return $processor->get_updated_html();
	}

	/**
	 * Mirrors hasConditionalShowToOutput() in src/blockTypes/conditionalLogic.ts.
	 *
	 * @param mixed $conditional_show conditionalShow attribute value.
	 * @return bool
	 */
	public static function has_conditions($conditional_show): bool
	{
		if (! is_array($conditional_show)) {
			return false;
		}

		if (! empty($conditional_show['sourceFieldName'])) {
			return true;
		}

		return ! empty($conditional_show['conditions']) && is_array($conditional_show['conditions']);
	}
}
