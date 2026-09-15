<?php
/**
 * Provider Registry
 *
 * Singleton class that manages all available provider instances.
 *
 * @package StreameryForms\Providers
 * @since 1.0.0
 */

namespace StreameryForms\Providers;

use StreameryForms\Traits\Base;

defined( 'ABSPATH' ) || exit;

/**
 * Provider Registry Class
 *
 * Manages all registered provider instances using a singleton pattern.
 */
class Registry {
	use Base;

	/**
	 * All registered provider instances.
	 *
	 * @var array<string, AbstractProvider>
	 */
	private array $providers = array();

	/**
	 * Initializes the registry and registers all providers.
	 */
	private function __construct() {
		$this->register_all_providers();
	}

	/**
	 * Registers all available providers.
	 *
	 * Uses the 'streamery-forms/available_providers' filter so add-ons (e.g. the Pro
	 * plugin) can register their own provider classes without touching core.
	 */
	private function register_all_providers(): void {
		$base_providers = array(
			Email::class,
			Database::class,
			Webhook::class,
		);

		$provider_classes = apply_filters(
			'streamery-forms/available_providers',
			$base_providers
		);

		foreach ( $provider_classes as $provider_class ) {
			if ( is_subclass_of( $provider_class, AbstractProvider::class ) ) {
				$instance = new $provider_class();
				$this->providers[ $instance->get_slug() ] = $instance;
			}
		}
	}

	/**
	 * Returns a provider instance.
	 *
	 * @param string $slug The provider slug.
	 * @return AbstractProvider|null The provider instance, or null if unknown.
	 */
	public function get_provider( string $slug ): ?AbstractProvider {
		return $this->providers[ $slug ] ?? null;
	}

	/**
	 * Returns all registered providers.
	 *
	 * @return array<string, AbstractProvider>
	 */
	public function get_all_providers(): array {
		return $this->providers;
	}

	/**
	 * Checks whether a provider exists.
	 *
	 * @param string $slug The provider slug.
	 * @return bool
	 */
	public function has_provider( string $slug ): bool {
		return isset( $this->providers[ $slug ] );
	}

	/**
	 * Returns the providers that must run for every submission.
	 *
	 * @return array<string, AbstractProvider>
	 */
	public function get_required_providers(): array {
		return array_filter(
			$this->providers,
			function ( AbstractProvider $provider ) {
				return $provider->is_required();
			}
		);
	}

	/**
	 * Returns the slugs of the providers that must run for every submission.
	 *
	 * @return array<string>
	 */
	public function get_required_provider_slugs(): array {
		return array_keys( $this->get_required_providers() );
	}
}
