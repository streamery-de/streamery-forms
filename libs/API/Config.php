<?php
/**
 * Route Configuration.
 * 
 * @since 1.0.0
 */

namespace StreameryForms\Libs\API;

use StreameryForms\Libs\API\ApiRouteException;

defined('ABSPATH') || exit;

/**
 * Class ApiConfig
 *
 * @since 1.0.0
 */
class Config {
	private static $route_file;
	private static $namespace = null;

	/**
	 * Private constructor to protect making instance.
	 */
	private function __construct() { }

	/**
	 * Set route file path.
	 *
	 * @since 1.0.0
	 *
	 * @param string $file absolute file path of api route file.
	 *
	 * @return self
	 *
	 * @throws ApiRouteException If route file does not exist.
	 */
	public static function set_route_file( $file ) {
		if ( ! file_exists( $file ) ) {
			throw new ApiRouteException( 'Route file does not exist.' );
		}

		self::$route_file = $file;
		return new self();
	}

	/**
	 * Set class namespace for resolve callback for api.
	 *
	 * @since 1.0.0
	 *
	 * @param string $namespace namespace.
	 *
	 * @return self
	 */
	public function set_namespace( $namespace ) {
		self::$namespace = $namespace;
		return $this;
	}

	/**
	 * Init config
	 *
	 * @since 1.0.0
	 *
	 * @throws ApiRouteException If route file does not provide.
	 */
	public function init() {
		if ( empty( self::$route_file ) ) {
			throw new ApiRouteException( 'API route file is required' );
		}

		add_action(
			'rest_api_init',
			function() {
				if ( ! empty( self::$namespace ) ) {
					Route::set_class_namespace( self::$namespace );
				}

				require_once self::$route_file;
				Route::dispatch();
			}
		);

	}
}
