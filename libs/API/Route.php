<?php

/**
 * API Route
 *
 * @package WordPressPluginBoilerplate\API
 * @since 1.0.0
 */

namespace StreameryForms\Libs\API;

use StreameryForms\Libs\API\ApiRouteException;

defined('ABSPATH') || exit;

/**
 * Class ApiRoute
 *
 * @since 1.0.0
 */
class Route
{

	private const METHOD_GET  = 'GET';
	private const METHOD_POST = 'POST';

	/**
	 * Explicit opt-in marker for a route that must stay open to anonymous
	 * requests (e.g. form submission, file upload). Pass this as the auth
	 * argument -- routes are deny-by-default otherwise.
	 */
	public const ALLOW_PUBLIC = '__streamery_forms_public_route__';

	/**
	 * All registerd routes.
	 *
	 * @var array
	 */
	private static $routes = array();

	/**
	 * Default namespace location of classes.
	 *
	 * @var string
	 */
	private static $namespace;

	/**
	 * Store current route details.
	 *
	 * @var array
	 */
	private $current;

	/**
	 * Statically called method handle
	 *
	 * @since 1.0.0
	 *
	 * @param string $name function name.
	 * @param array  $arguments arguments.
	 *
	 * @return void
	 */
	public function __call($name, $arguments)
	{
		$self  = $this;
		$count = count($arguments);

		if ('get' === $name && in_array($count, array(2, 3), true)) {
			$self->get_normal(...$arguments);
		}

		if ('post' === $name && in_array($count, array(2, 3), true)) {
			$self->post_normal(...$arguments);
		}
	}

	/**
	 * Statically called method handle
	 *
	 * @since 1.0.0
	 *
	 * @param string $name function name.
	 * @param array  $arguments arguments.
	 *
	 * @return self
	 */
	public static function __callStatic($name, $arguments)
	{
		$self  = new self();
		$count = count($arguments);

		if ('get' === $name && in_array($count, array(3, 4), true)) {
			$self->get_with_namespace(...$arguments);
		}

		if ('post' === $name && in_array($count, array(3, 4), true)) {
			$self->post_with_namespace(...$arguments);
		}

		if ('prefix' === $name && 1 === $count) {
			return $self->prefix_one(...$arguments);
		}

		if ('prefix' === $name && 2 === $count) {
			return $self->prefix_two(...$arguments);
		}
	}

	/**
	 * Set default namespace for class resolve.
	 *
	 * @since 1.0.0
	 *
	 * @param string $namespace namespace.
	 * @return void
	 */
	public static function set_class_namespace($namespace)
	{
		self::$namespace = $namespace;
	}

	/**
	 * Get all registered routes.
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public static function get_routes()
	{
		return self::$routes;
	}

	/**
	 * Prepare route data.
	 *
	 * @since 1.0.0
	 *
	 * @param string               $method route method GET, POST.
	 * @param string               $prefix route prefix.
	 * @param string               $endpoint route endpoint.
	 * @param string               $callback callback.
	 * @param bool|string|callable $auth auth callback. Deny-by-default: omitting this
	 *                                   (or passing null/false) denies the request.
	 *                                   Pass Route::ALLOW_PUBLIC to explicitly open a route.
	 *
	 * @return array
	 */
	private function prepare_route_data($method, $prefix, $endpoint, $callback, $auth = null)
	{
		$data = array(
			'prefix'   => $prefix,
			'method'   => $method,
			'endpoint' => $endpoint,
			'callback' => $callback,
			'auth'     => $auth,
		);

		if (isset($this->current['group'])) {
			$data['group'] = $this->current['group'];
		}

		return $data;
	}

	/**
	 * Get route register.
	 *
	 * @since 1.0.0
	 *
	 * @param string $endpoint api endpint.
	 * @param mixed  $callback callback function.
	 * @param mixed  $auth auth check logic.
	 *
	 * @return void
	 */
	private function get_normal($endpoint, $callback, $auth = null)
	{
		$prefix = $this->current['prefix'];
		$route  = $this->prepare_route_data(self::METHOD_GET, $prefix, $endpoint, $callback, $auth);

		self::$routes[$prefix][] = $route;
	}

	/**
	 * Get route with namespace.
	 *
	 * @since 1.0.0
	 *
	 * @param string $prefix prefix.
	 * @param string $endpoint api endpint.
	 * @param mixed  $callback callback function.
	 * @param mixed  $auth auth check logic.
	 *
	 * @return void
	 */
	private function get_with_namespace($prefix, $endpoint, $callback, $auth = null)
	{
		self::$routes[$prefix][] = $this->prepare_route_data(self::METHOD_GET, $prefix, $endpoint, $callback, $auth);
	}

	/**
	 * Post route register.
	 *
	 * @since 1.0.0
	 *
	 * @param string $endpoint api endpint.
	 * @param mixed  $callback callback function.
	 * @param mixed  $auth auth check logic.
	 *
	 * @return void
	 */
	public function post_normal($endpoint, $callback, $auth = null)
	{
		$prefix = $this->current['prefix'];
		$route  = $this->prepare_route_data(self::METHOD_POST, $prefix, $endpoint, $callback, $auth);

		self::$routes[$prefix][] = $route;
	}

	/**
	 * Post route with namespace.
	 *
	 * @since 1.0.0
	 *
	 * @param string $prefix prefix.
	 * @param string $endpoint api endpint.
	 * @param mixed  $callback callback function.
	 * @param mixed  $auth auth check logic.
	 *
	 * @return void
	 */
	private function post_with_namespace($prefix, $endpoint, $callback, $auth = null)
	{
		self::$routes[$prefix][] = $this->prepare_route_data(self::METHOD_POST, $prefix, $endpoint, $callback, $auth);
	}

	/**
	 * Set prefix for a route.
	 *
	 * @since 1.0.0
	 *
	 * @param string $name prefix name.
	 *
	 * @return self
	 */
	private function prefix_one($name)
	{
		$this->current['prefix'] = $name;
		return $this;
	}

	/**
	 * Register routes in a prefix.
	 *
	 * @since 1.0.0
	 *
	 * @param string   $name prefix name.
	 * @param callable $callback callback.
	 *
	 * @return self
	 *
	 * @throws ApiRouteException If invalid callback provided.
	 */
	private function prefix_two($name, $callback)
	{
		if (! is_callable($callback)) {
			throw new ApiRouteException('Invalid callback for prefix');
		}

		$this->current['prefix'] = $name;
		$this->current['group']  = microtime(true) * 1000 + wp_rand(0, 999);

		/**
		 * The invokation of $callback must be under prefix set.
		 * Callback has one or more routes.
		 */
		$callback($this);

		return $this;
	}

	/**
	 * Set auth callback to all route under a prefix.
	 *
	 * @since 1.0.0
	 *
	 * @param mixed $callback callback.
	 *
	 * @return void
	 */
	public function auth($callback)
	{
		$target_prefix = $this->current['prefix'];
		foreach (self::$routes as &$prefix) {
			foreach ($prefix as &$route) {
				/**
				 * The authorization callback is overridden
				 * only when no previous auth callback has been registered.
				 */
				if (
					isset($this->current['group'])
					&& $this->current['group'] === $route['group']
					&& $target_prefix === $route['prefix']
					&& empty($route['auth'])
				) {
					$route['auth'] = $callback;
				}
			}
		}

		if (isset($this->current['group'])) {
			unset($this->current['group']);
		}
	}

	/**
	 * Check string as specific substring.
	 *
	 * @since 1.0.0
	 *
	 * @param string $str target string.
	 * @param string $find find string.
	 *
	 * @return bool
	 */
	private static function str_has($str, $find)
	{
		return strpos($str, $find) !== false;
	}

	/**
	 * Prepare callback
	 *
	 * @since 1.0.0
	 *
	 * @param mixed $callback callback.
	 *
	 * @return mixed
	 *
	 * @throws ApiRouteException If invalid callback.
	 */
	private static function prepare_callback($callback)
	{
		// Deny-by-default: no auth argument (null) and explicit false both deny.
		if (null === $callback || false === $callback) {
			return '__return_false';
		}

		// Explicit opt-in to a public route, or a plain "must be logged in" flag.
		if (true === $callback || self::ALLOW_PUBLIC === $callback) {
			return '__return_true';
		}

		if (! is_array($callback) && is_callable($callback)) {
			return $callback;
		}

		if (is_array($callback)) {
			$class  = $callback[0];
			$method = $callback[1];

			return array(
				new $class(),
				$method,
			);
		}

		if (is_string($callback) && self::str_has($callback, '@')) {
			$arr    = explode('@', $callback, 2);
			$class  = $arr[0];
			$method = $arr[1];

			if (! empty(self::$namespace) && ! self::str_has($class, '\\')) {
				$class = self::$namespace . '\\' . $class;
			}

			return array(
				new $class(),
				$method,
			);
		}

		throw new ApiRouteException('Invalid callback');
	}

	/**
	 * Dispatch all registered routes.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 *
	 * @throws ApiRouteException If route does not have a prefix.
	 */
	public static function dispatch()
	{
		foreach (self::$routes as $prefix) {
			foreach ($prefix as $route) {

				$route    = (object) $route;
				$callback = self::prepare_callback($route->callback);
				$auth     = self::prepare_callback($route->auth);

				$args = array(
					'methods'             => $route->method,
					'permission_callback' => $auth,
					'callback'            => $callback,
					'args'                => self::extract_args($route->endpoint),
				);

				if (! isset($route->prefix)) {
					throw new ApiRouteException(esc_html((string) $route->endpoint) . ' must have a prefix');
				}

				$endpoint = self::convert_to_regex($route->endpoint);

				register_rest_route($route->prefix, $endpoint, $args);
			}
		}
	}

	/**
	 * Builds a sanitize/validate args schema for URL placeholders.
	 *
	 * Currently constrains the common `{id}` placeholder to numeric values;
	 * other placeholder names keep WordPress' default (string) handling since
	 * they don't share a single safe type across routes.
	 *
	 * @since 1.0.0
	 *
	 * @param string $endpoint api endpoint with `{placeholder}` segments.
	 *
	 * @return array
	 */
	private static function extract_args($endpoint)
	{
		$args = array();

		if (preg_match_all('/\{(\w+)\}/', $endpoint, $matches)) {
			foreach ($matches[1] as $name) {
				if ('id' === $name) {
					$args[$name] = array(
						'validate_callback' => function ($value) {
							return is_numeric($value);
						},
						'sanitize_callback' => 'absint',
					);
				}
			}
		}

		return $args;
	}

	/**
	 * Convert URL schema to regex pattern.
	 *
	 * @since 1.0.0
	 */
	private static function convert_to_regex($url)
	{
		// Replace placeholders with regex patterns. The {id} placeholder is
		// constrained to digits since every route using it looks up a numeric
		// primary key; other placeholders keep the permissive [^/]+ match.
		$regex = preg_replace_callback(
			'/\{(\w+)\}/',
			function ($matches) {
				$name    = $matches[1];
				$pattern = ('id' === $name) ? '[0-9]+' : '[^/]+';
				return '(?P<' . $name . '>' . $pattern . ')';
			},
			$url
		);

		return $regex;
	}
}
