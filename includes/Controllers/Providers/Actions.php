<?php

/**
 * Class Actions
 *
 * Handles provider-related actions such as creation, retrieval, deletion, and update.
 *
 * @package StreameryForms\Controllers\Providers
 * @since 1.0.0
 */

namespace StreameryForms\Controllers\Providers;

use StreameryForms\Core\Crypto;
use StreameryForms\Models\Providers;
use StreameryForms\Providers\Registry;

defined('ABSPATH') || exit;

/**
 * Class Actions
 *
 * Handles provider-related actions.
 *
 * @package StreameryForms\Controllers\Providers
 */
class Actions
{

	/**
	 * Placeholder returned in place of a stored secret. A settings payload that
	 * still carries this value on update means "leave the secret unchanged".
	 */
	private const SECRET_MASK = '••••••••';

	/**
	 * Returns the names of a provider type's secret settings fields.
	 *
	 * @param string $provider_type Provider slug.
	 * @return array<string>
	 */
	private function get_secret_field_names(string $provider_type): array
	{
		$provider = Registry::get_instance()->get_provider($provider_type);
		if (! $provider) {
			return array();
		}

		$secrets = array();
		foreach ($provider->get_settings_fields() as $field) {
			if (! empty($field['is_secret']) && ! empty($field['name'])) {
				$secrets[] = (string) $field['name'];
			}
		}

		return $secrets;
	}

	/**
	 * Replaces every secret value in a feed's settings with a mask, so
	 * credentials are never returned over the REST API.
	 *
	 * @param object $provider Feed row.
	 * @return object
	 */
	private function mask_secrets($provider)
	{
		if (! $provider || ! is_array($provider->settings)) {
			return $provider;
		}

		$settings = $provider->settings;
		foreach ($this->get_secret_field_names((string) $provider->provider_type) as $name) {
			if (! empty($settings[$name])) {
				$settings[$name] = self::SECRET_MASK;
			}
		}

		$provider->settings = $settings;

		return $provider;
	}

	/**
	 * Encrypts incoming secret values, and preserves the stored value when the
	 * client sends back the mask (or an empty value) instead of a new secret.
	 *
	 * @param array  $incoming      Submitted settings.
	 * @param array  $existing      Currently stored settings.
	 * @param string $provider_type Provider slug.
	 * @return array
	 */
	private function protect_secrets(array $incoming, array $existing, string $provider_type): array
	{
		foreach ($this->get_secret_field_names($provider_type) as $name) {
			$submitted = $incoming[$name] ?? '';

			if ('' === $submitted || self::SECRET_MASK === $submitted) {
				// Unchanged: keep whatever is already stored.
				if (isset($existing[$name])) {
					$incoming[$name] = $existing[$name];
				} else {
					unset($incoming[$name]);
				}
				continue;
			}

			$incoming[$name] = Crypto::encrypt((string) $submitted);
		}

		return $incoming;
	}

	/**
	 * Creates a new provider.
	 *
	 * @param \WP_REST_Request $request The REST request object.
	 * @return array|\WP_Error The response message or error.
	 */
	public function create(\WP_REST_Request $request)
	{
		try {
			// UNIQUE constraint on provider_type removed - multiple providers per type allowed
			// form_identifier is optional (NULL = global provider)

			$provider_type = sanitize_text_field((string) $request->get_param('provider_type'));
			$settings      = $request->get_param('settings') ?? array();
			$settings      = is_array($settings) ? $settings : array();

			$provider = new Providers();
			$provider->name            = $request->get_param('name');
			$provider->provider_type   = $provider_type;
			$provider->form_identifier  = $request->get_param('form_identifier') ? sanitize_text_field($request->get_param('form_identifier')) : null;
			$provider->settings         = $this->protect_secrets($settings, array(), $provider_type);
			$provider->is_active       = $request->get_param('is_active') ?? true;
			$provider->date_created    = current_time('mysql');

			$provider->save();

			return array(
				'success' => true,
				'message' => __('Provider created successfully.', 'streamery-forms'),
				'data'    => $this->mask_secrets($provider),
			);
		} catch (\Exception $e) {
			return new \WP_Error(
				'provider_creation_failed',
				__('Failed to create provider: ', 'streamery-forms') . $e->getMessage(),
				array('status' => 500)
			);
		}
	}

	/**
	 * Retrieves all providers.
	 *
	 * @param \WP_REST_Request $request The REST request object.
	 * @return array|\WP_Error The list of providers or error.
	 */
	public function get(\WP_REST_Request $request)
	{
		try {
			$query = Providers::query();

			// Filter by is_active.
			if ($request->has_param('is_active')) {
				$query->where('is_active', $request->get_param('is_active') ? 1 : 0);
			}

			// Filter by provider_type.
			if ($request->get_param('provider_type')) {
				$query->where('provider_type', $request->get_param('provider_type'));
			}

			// Filter by form_identifier (optional).
			if ($request->has_param('form_identifier')) {
				$form_identifier = $request->get_param('form_identifier');
				if ($form_identifier === null || $form_identifier === '') {
					// NULL or empty = global providers
					$query->whereNull('form_identifier');
				} else {
					$query->where('form_identifier', sanitize_text_field($form_identifier));
				}
			}

			$providers = $query->orderBy('date_created', 'DESC')->get();

			foreach ($providers as $provider) {
				$this->mask_secrets($provider);
			}

			return array(
				'success' => true,
				'data'    => $providers,
			);
		} catch (\Exception $e) {
			return new \WP_Error(
				'provider_retrieval_failed',
				__('Failed to retrieve providers: ', 'streamery-forms') . $e->getMessage(),
				array('status' => 500)
			);
		}
	}

	/**
	 * Retrieves a single provider by ID.
	 *
	 * @param \WP_REST_Request $request The REST request object.
	 * @return array|\WP_Error The provider or error.
	 */
	public function get_single(\WP_REST_Request $request)
	{
		try {
			$id = $request->get_param('id');

			$provider = Providers::find($id);

			if (! $provider) {
				return new \WP_Error(
					'provider_not_found',
					__('Provider not found.', 'streamery-forms'),
					array('status' => 404)
				);
			}

			return array(
				'success' => true,
				'data'    => $this->mask_secrets($provider),
			);
		} catch (\Exception $e) {
			return new \WP_Error(
				'provider_retrieval_failed',
				__('Failed to retrieve provider: ', 'streamery-forms') . $e->getMessage(),
				array('status' => 500)
			);
		}
	}

	/**
	 * Retrieves a provider by provider_type.
	 *
	 * @param \WP_REST_Request $request The REST request object.
	 * @return array|\WP_Error The provider or error.
	 */
	public function get_by_type(\WP_REST_Request $request)
	{
		try {
			$provider_type = $request->get_param('provider_type');

			// For database provider, prefer global provider (form_identifier is NULL)
			if ($provider_type === 'database') {
				$provider = Providers::where('provider_type', $provider_type)
					->whereNull('form_identifier')
					->first();
			} else {
				$provider = Providers::where('provider_type', $provider_type)->first();
			}

			if (! $provider) {
				return new \WP_Error(
					'provider_not_found',
					__('Provider not found.', 'streamery-forms'),
					array('status' => 404)
				);
			}

			return array(
				'success' => true,
				'data'    => $this->mask_secrets($provider),
			);
		} catch (\Exception $e) {
			return new \WP_Error(
				'provider_retrieval_failed',
				__('Failed to retrieve provider: ', 'streamery-forms') . $e->getMessage(),
				array('status' => 500)
			);
		}
	}

	/**
	 * Updates a provider.
	 *
	 * @param \WP_REST_Request $request The REST request object.
	 * @return array|\WP_Error The response message or error.
	 */
	public function update(\WP_REST_Request $request)
	{
		$id = $request->get_param('id');

		$provider = Providers::find($id);

		if (! $provider) {
			return new \WP_Error(
				'provider_not_found',
				__('Provider not found.', 'streamery-forms'),
				array('status' => 404)
			);
		}

		try {
			// UNIQUE constraint on provider_type removed - multiple providers per type allowed

			if ($request->has_param('name')) {
				$provider->name = $request->get_param('name');
			}
			if ($request->has_param('provider_type')) {
				$provider->provider_type = $request->get_param('provider_type');
			}
			if ($request->has_param('form_identifier')) {
				$form_identifier = $request->get_param('form_identifier');
				$provider->form_identifier = ($form_identifier === null || $form_identifier === '') ? null : sanitize_text_field($form_identifier);
			}
			if ($request->has_param('settings')) {
				$incoming = $request->get_param('settings');
				$incoming = is_array($incoming) ? $incoming : array();
				$existing = is_array($provider->settings) ? $provider->settings : array();

				// A masked or empty secret means "unchanged" -- never overwrite a
				// stored credential with the placeholder we handed the client.
				$provider->settings = $this->protect_secrets(
					$incoming,
					$existing,
					(string) $provider->provider_type
				);
			}
			if ($request->has_param('is_active')) {
				$provider->is_active = $request->get_param('is_active');
			}

			$provider->save();

			return array(
				'success' => true,
				'message' => __('Provider updated successfully.', 'streamery-forms'),
				'data'    => $this->mask_secrets($provider),
			);
		} catch (\Exception $e) {
			return new \WP_Error(
				'provider_update_failed',
				__('Failed to update provider: ', 'streamery-forms') . $e->getMessage(),
				array('status' => 500)
			);
		}
	}

	/**
	 * Deletes a provider.
	 *
	 * @param \WP_REST_Request $request The REST request object.
	 * @return array|\WP_Error The response message or error.
	 */
	public function delete(\WP_REST_Request $request)
	{
		$id = $request->get_param('id');

		$provider = Providers::find($id);

		if (! $provider) {
			return new \WP_Error(
				'provider_not_found',
				__('Provider not found.', 'streamery-forms'),
				array('status' => 404)
			);
		}

		try {
			$provider->delete();

			return array(
				'success' => true,
				'message' => __('Provider deleted successfully.', 'streamery-forms'),
			);
		} catch (\Exception $e) {
			return new \WP_Error(
				'provider_deletion_failed',
				__('Failed to delete provider: ', 'streamery-forms') . $e->getMessage(),
				array('status' => 500)
			);
		}
	}

	/**
	 * Returns all available provider types with their field definitions.
	 *
	 * @param \WP_REST_Request $request
	 * @return array|\WP_Error
	 */
	public function get_provider_types(\WP_REST_Request $request)
	{
		try {
			$registry = \StreameryForms\Providers\Registry::get_instance();
			$providers = $registry->get_all_providers();

			$types = array();
			foreach ($providers as $slug => $provider) {
				$types[] = array(
					'slug'  => $slug,
					'title' => $provider->get_title(),
					'icon'  => $provider->get_icon(),
					// Field *definitions* only -- never stored values, so no
					// secret can leak through this endpoint.
					'fields' => $provider->get_settings_fields(),
					// Lets the editor render required providers as a locked,
					// non-removable entry instead of a toggle.
					'is_required'          => $provider->is_required(),
					'form_overridable'     => $provider->get_form_overridable_settings(),
				);
			}

			return array(
				'success' => true,
				'data'    => $types,
			);
		} catch (\Exception $e) {
			return new \WP_Error(
				'provider_types_retrieval_failed',
				__('Failed to retrieve provider types: ', 'streamery-forms') . $e->getMessage(),
				array('status' => 500)
			);
		}
	}
}
