<?php
/**
 * Skin Registry
 *
 * Collects the built-in skin plus any skins a theme or add-on registers via
 * the 'streamery-forms/skins' filter.
 *
 * @package StreameryForms\Core
 */

declare(strict_types=1);

namespace StreameryForms\Core;

use StreameryForms\Traits\Base;

defined('ABSPATH') || exit;

/**
 * Skins Class
 *
 * Singleton that validates and exposes all available form skins.
 */
class Skins
{
	use Base;

	/**
	 * Slug of the built-in skin, which can never be overridden.
	 */
	const DEFAULT_SKIN = 'default';

	/**
	 * Validated skins, keyed by slug. Null until first resolved.
	 *
	 * @var array<string, array{label: string, description: string, url: string, extends: ?string}>|null
	 */
	private ?array $skins = null;

	/**
	 * Singleton only.
	 */
	private function __construct()
	{
	}

	/**
	 * Returns all valid skins, keyed by slug.
	 *
	 * @return array<string, array{label: string, description: string, url: string, extends: ?string}>
	 */
	public function get_skins(): array
	{
		if (null !== $this->skins) {
			return $this->skins;
		}

		$default = array(
			'label'       => __('Default', 'streamery-forms'),
			'description' => __('Default skin for Streamery Forms.', 'streamery-forms'),
			'url'         => STREAMERY_FORMS_ASSETS_URL . '/blocks/skins/default/index.css',
			'extends'     => null,
		);

		/**
		 * Register additional form skins.
		 *
		 * @param array $skins slug => ['label' => string, 'description' => string, 'url' => string, 'extends' => ?string]
		 */
		$filtered = apply_filters('streamery-forms/skins', array(self::DEFAULT_SKIN => $default));

		$skins = array(self::DEFAULT_SKIN => $default);

		if (is_array($filtered)) {
			foreach ($filtered as $slug => $skin) {
				$slug = sanitize_key((string) $slug);
				if ('' === $slug || self::DEFAULT_SKIN === $slug || ! is_array($skin)) {
					continue;
				}

				$label = isset($skin['label']) ? sanitize_text_field((string) $skin['label']) : '';
				$url   = isset($skin['url']) ? esc_url_raw((string) $skin['url']) : '';
				if ('' === $label || '' === $url) {
					continue;
				}

				$skins[$slug] = array(
					'label'       => $label,
					'description' => isset($skin['description']) ? sanitize_text_field((string) $skin['description']) : '',
					'url'         => $url,
					'extends'     => ! empty($skin['extends']) ? sanitize_key((string) $skin['extends']) : null,
				);
			}
		}

		// Second pass: 'extends' may only point at a skin that survived validation.
		foreach ($skins as $slug => $skin) {
			if (null !== $skin['extends'] && ($skin['extends'] === $slug || ! isset($skins[$skin['extends']]))) {
				$skins[$slug]['extends'] = null;
			}
		}

		$this->skins = $skins;

		return $this->skins;
	}

	/**
	 * Returns a lean list of skins for the block editor and view scripts.
	 *
	 * @return array<int, array{name: string, label: string, description: string, url: string, extends: ?string}>
	 */
	public function get_client_config(): array
	{
		$config = array();

		foreach ($this->get_skins() as $slug => $skin) {
			$config[] = array(
				'name'        => $slug,
				'label'       => $skin['label'],
				'description' => $skin['description'],
				'url'         => $skin['url'],
				'extends'     => $skin['extends'],
			);
		}

		return $config;
	}
}
