<?php

/**
 * Webhook Provider
 *
 * POSTs form submissions to an operator-configured HTTP endpoint, optionally
 * signed with an HMAC so the receiver can verify the payload really came from
 * this site and hasn't been replayed.
 *
 * @package StreameryForms\Providers
 * @since 1.0.0
 */

namespace StreameryForms\Providers;

use StreameryForms\Core\Crypto;
use StreameryForms\Core\Debug;
use StreameryForms\Models\Providers as ProviderModel;

defined('ABSPATH') || exit;

/**
 * Webhook Provider Class
 */
class Webhook extends AbstractProvider
{
    /**
     * Hard ceiling on the request timeout, so a misconfigured endpoint can't
     * hold a visitor's submission request open indefinitely.
     */
    private const MAX_TIMEOUT = 15;

    /**
     * Default request timeout in seconds.
     */
    private const DEFAULT_TIMEOUT = 10;

    /**
     * Returns the unique slug of the provider.
     *
     * @return string
     */
    public function get_slug(): string
    {
        return 'webhook';
    }

    /**
     * Returns the display name of the provider.
     *
     * @return string
     */
    public function get_title(): string
    {
        return __('Webhook', 'streamery-forms');
    }

    /**
     * Processes a form submission by delivering it to the configured endpoint.
     *
     * @param array  $submission_data   The form data.
     * @param array  $provider_settings The individual settings for this provider.
     * @param string $form_identifier   The form identifier.
     * @return bool Success of processing.
     */
    public function process_submission(
        array $submission_data,
        array $provider_settings,
        string $form_identifier
    ): bool {
        $url = isset($provider_settings['url']) ? trim((string) $provider_settings['url']) : '';

        $url_error = $this->validate_url($url);
        if (null !== $url_error) {
            $this->record_delivery($provider_settings, 0, $url_error);
            return false;
        }

        $payload = $this->build_payload($submission_data, $provider_settings, $form_identifier);
        $method  = $this->normalize_method($provider_settings['method'] ?? 'POST');

        $content_type = $provider_settings['content_type'] ?? 'application/json';
        if ('application/x-www-form-urlencoded' === $content_type) {
            $body = http_build_query($this->flatten_for_form_encoding($payload));
        } else {
            $content_type = 'application/json';
            $body         = wp_json_encode($payload);
        }

        $headers = $this->build_headers($provider_settings, $content_type, (string) $body);

        $timeout = isset($provider_settings['timeout']) ? (int) $provider_settings['timeout'] : self::DEFAULT_TIMEOUT;
        $timeout = max(1, min($timeout, self::MAX_TIMEOUT));

        $args = array(
            'method'      => $method,
            'timeout'     => $timeout,
            'redirection' => 0,
            'sslverify'   => true,
            'headers'     => $headers,
            'body'        => $body,
            'user-agent'  => 'StreameryForms/' . (defined('STREAMERY_FORMS_VERSION') ? STREAMERY_FORMS_VERSION : '1.0.0') . '; ' . home_url('/'),
        );

        $response = wp_remote_request($url, $args);
        $result   = $this->evaluate_response($response);

        // One immediate retry on a network error or 5xx -- deliberately no queue
        // (see the release plan); the database feed has already stored the
        // submission, so a permanently failing endpoint never costs a lead.
        if (! $result['success'] && $result['retryable']) {
            $response = wp_remote_request($url, $args);
            $result   = $this->evaluate_response($response);
        }

        $this->record_delivery($provider_settings, $result['status'], $result['error']);

        return $result['success'];
    }

    /**
     * Classifies a wp_remote_request() result.
     *
     * @param array|\WP_Error $response Response.
     * @return array{success: bool, retryable: bool, status: int, error: string}
     */
    private function evaluate_response($response): array
    {
        if (is_wp_error($response)) {
            return array(
                'success'   => false,
                'retryable' => true,
                'status'    => 0,
                'error'     => $response->get_error_message(),
            );
        }

        $status = (int) wp_remote_retrieve_response_code($response);

        if ($status >= 200 && $status < 300) {
            return array('success' => true, 'retryable' => false, 'status' => $status, 'error' => '');
        }

        return array(
            'success'   => false,
            'retryable' => $status >= 500,
            'status'    => $status,
            'error'     => sprintf(
                /* translators: %d: HTTP status code returned by the webhook endpoint. */
                __('Endpoint returned HTTP %d.', 'streamery-forms'),
                $status
            ),
        );
    }

    /**
     * Validates the target URL and blocks requests aimed at the server itself
     * or at private network ranges (SSRF).
     *
     * @param string $url Target URL.
     * @return string|null Error message, or null when the URL is acceptable.
     */
    private function validate_url(string $url): ?string
    {
        if ('' === $url) {
            return __('No webhook URL configured.', 'streamery-forms');
        }

        $parts = wp_parse_url($url);
        if (empty($parts['host']) || empty($parts['scheme'])) {
            return __('Webhook URL is not a valid absolute URL.', 'streamery-forms');
        }

        if (! in_array(strtolower($parts['scheme']), array('http', 'https'), true)) {
            return __('Webhook URL must use http or https.', 'streamery-forms');
        }

        /**
         * Filters whether the webhook provider may target private, loopback, or
         * link-local addresses. Off by default -- turning this on re-opens an
         * SSRF path, so only do it for a deliberately self-hosted internal endpoint.
         *
         * @param bool   $allow Whether private hosts are allowed.
         * @param string $url   The target URL.
         */
        if (apply_filters('streamery-forms/webhook/allow_private_hosts', false, $url)) {
            return null;
        }

        if ($this->is_private_host($parts['host'])) {
            return __('Webhook URL points at a private or local address, which is not allowed.', 'streamery-forms');
        }

        return null;
    }

    /**
     * @param string $host Hostname or IP literal.
     * @return bool
     */
    private function is_private_host(string $host): bool
    {
        $host = trim($host, '[]'); // strip IPv6 brackets

        if (in_array(strtolower($host), array('localhost', 'localhost.localdomain'), true)) {
            return true;
        }

        $ips = array();

        if (filter_var($host, FILTER_VALIDATE_IP)) {
            $ips[] = $host;
        } else {
            $resolved = @gethostbynamel($host);
            if (is_array($resolved)) {
                $ips = $resolved;
            } else {
                // Can't resolve -- treat as unsafe rather than firing blind.
                return true;
            }
        }

        foreach ($ips as $ip) {
            if (false === filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param string $method Configured method.
     * @return string
     */
    private function normalize_method(string $method): string
    {
        $method = strtoupper(trim($method));

        return in_array($method, array('POST', 'PUT', 'PATCH'), true) ? $method : 'POST';
    }

    /**
     * Builds the request headers: content type, authentication, custom headers,
     * and the HMAC signature.
     *
     * @param array  $settings     Provider settings.
     * @param string $content_type Resolved content type.
     * @param string $body         Serialized request body.
     * @return array<string, string>
     */
    private function build_headers(array $settings, string $content_type, string $body): array
    {
        $headers = array(
            'Content-Type' => $content_type,
            'Accept'       => 'application/json',
        );

        switch ($settings['auth_type'] ?? 'none') {
            case 'bearer':
                $token = $this->reveal($settings['auth_token'] ?? '');
                if ('' !== $token) {
                    $headers['Authorization'] = 'Bearer ' . $token;
                }
                break;

            case 'api_key':
                $header_name = $this->sanitize_header_name((string) ($settings['api_key_header'] ?? ''));
                $key         = $this->reveal($settings['api_key'] ?? '');
                if ('' !== $header_name && '' !== $key) {
                    $headers[$header_name] = $key;
                }
                break;

            case 'basic':
                $user = (string) ($settings['auth_user'] ?? '');
                $pass = $this->reveal($settings['auth_password'] ?? '');
                if ('' !== $user) {
                    $headers['Authorization'] = 'Basic ' . base64_encode($user . ':' . $pass);
                }
                break;
        }

        foreach ($this->parse_custom_headers($settings['custom_headers'] ?? array()) as $name => $value) {
            $headers[$name] = $value;
        }

        // HMAC signature over "<timestamp>.<body>" -- the Stripe/GitHub pattern,
        // where including the timestamp is what makes a captured payload
        // un-replayable by the receiver.
        if (! empty($settings['sign_payload'])) {
            $secret = $this->reveal($settings['secret'] ?? '');
            if ('' !== $secret) {
                $timestamp = (string) time();
                $headers['X-Streamery-Forms-Timestamp'] = $timestamp;
                $headers['X-Streamery-Forms-Signature'] = 'sha256=' . hash_hmac('sha256', $timestamp . '.' . $body, $secret);
            }
        }

        return $headers;
    }

    /**
     * Normalizes the custom-headers repeater into a name => value map,
     * rejecting header names outside the token charset.
     *
     * @param mixed $raw Raw repeater value.
     * @return array<string, string>
     */
    private function parse_custom_headers($raw): array
    {
        if (! is_array($raw)) {
            return array();
        }

        $headers = array();

        foreach ($raw as $row) {
            if (! is_array($row)) {
                continue;
            }

            $name  = $this->sanitize_header_name((string) ($row['key'] ?? ''));
            $value = (string) ($row['value'] ?? '');

            if ('' === $name) {
                continue;
            }

            // Strip CR/LF so a configured value can't inject extra headers.
            $headers[$name] = trim(str_replace(array("\r", "\n"), '', $value));
        }

        return $headers;
    }

    /**
     * @param string $name Raw header name.
     * @return string Sanitized name, or '' if it isn't a valid header token.
     */
    private function sanitize_header_name(string $name): string
    {
        $name = trim($name);

        return preg_match('/^[A-Za-z0-9-]+$/', $name) ? $name : '';
    }

    /**
     * Builds the payload envelope, applying the per-form field mapping.
     *
     * @param array  $submission_data Form data.
     * @param array  $settings        Provider settings (incl. per-form field_map).
     * @param string $form_identifier Form identifier.
     * @return array
     */
    private function build_payload(array $submission_data, array $settings, string $form_identifier): array
    {
        $files  = array();
        $fields = array();

        foreach ($submission_data as $key => $value) {
            if (0 === strpos((string) $key, '_')) {
                continue; // internal metadata (e.g. _primary_mail_field)
            }

            if (is_array($value) && ! empty($value) && is_array($value[0] ?? null) && isset($value[0]['url'])) {
                foreach ($value as $file) {
                    $files[] = array(
                        'name' => $file['original_name'] ?? ($file['name'] ?? ''),
                        'url'  => $file['url'] ?? '',
                        'size' => isset($file['size']) ? (int) $file['size'] : 0,
                        'type' => $file['type'] ?? '',
                    );
                }
                continue;
            }

            $fields[$key] = $value;
        }

        $fields = $this->apply_field_map($fields, $settings['field_map'] ?? array());

        $post_id = isset($settings['wp_post_id']) ? absint($settings['wp_post_id']) : 0;

        return array(
            'form' => array(
                'identifier' => $form_identifier,
                'title'      => (string) ($settings['_form_title'] ?? $form_identifier),
                'post_id'    => $post_id,
                'url'        => $post_id > 0 ? get_permalink($post_id) : home_url('/'),
            ),
            'submitted_at' => gmdate('c'),
            'fields'       => (object) $fields,
            'files'        => $files,
        );
    }

    /**
     * Applies a [{ field, key }] mapping, supporting dot paths in the target
     * key so a receiver can be handed a nested payload (e.g. "contact.email").
     * An empty map passes the fields through unchanged.
     *
     * @param array $fields Flat field values.
     * @param mixed $map    Mapping definition.
     * @return array
     */
    private function apply_field_map(array $fields, $map): array
    {
        if (! is_array($map) || empty($map)) {
            return $fields;
        }

        $mapped = array();

        foreach ($map as $rule) {
            if (! is_array($rule)) {
                continue;
            }

            $field = (string) ($rule['field'] ?? '');
            $key   = (string) ($rule['key'] ?? '');

            if ('' === $field || '' === $key || ! array_key_exists($field, $fields)) {
                continue;
            }

            $this->set_by_path($mapped, $key, $fields[$field]);
        }

        return $mapped;
    }

    /**
     * Writes a value into a nested array using a dot path.
     *
     * @param array  $target Target array (by reference).
     * @param string $path   Dot path.
     * @param mixed  $value  Value.
     * @return void
     */
    private function set_by_path(array &$target, string $path, $value): void
    {
        $segments = array_filter(explode('.', $path), function ($segment) {
            return '' !== $segment;
        });

        if (empty($segments)) {
            return;
        }

        $cursor = &$target;
        foreach ($segments as $index => $segment) {
            if ($index === count($segments) - 1) {
                $cursor[$segment] = $value;
                break;
            }

            if (! isset($cursor[$segment]) || ! is_array($cursor[$segment])) {
                $cursor[$segment] = array();
            }

            $cursor = &$cursor[$segment];
        }
    }

    /**
     * Flattens a nested payload for form-urlencoded delivery.
     *
     * @param array $payload Payload.
     * @return array
     */
    private function flatten_for_form_encoding(array $payload): array
    {
        $flat = array();

        $walk = function ($value, string $prefix) use (&$walk, &$flat) {
            if (is_array($value) || is_object($value)) {
                foreach ((array) $value as $key => $child) {
                    $walk($child, '' === $prefix ? (string) $key : $prefix . '[' . $key . ']');
                }
                return;
            }

            $flat[$prefix] = is_bool($value) ? ($value ? '1' : '0') : (string) $value;
        };

        $walk($payload, '');

        return $flat;
    }

    /**
     * Decrypts a stored secret. Values saved before encryption existed, or on
     * hosts without libsodium, pass through unchanged (see Core\Crypto).
     *
     * @param mixed $stored Stored value.
     * @return string
     */
    private function reveal($stored): string
    {
        return '' === (string) $stored ? '' : Crypto::decrypt((string) $stored);
    }

    /**
     * Stores the outcome of the last delivery attempt on the feed, so a failing
     * webhook is diagnosable from the admin instead of being silent.
     *
     * @param array  $settings Provider settings (carries the feed id).
     * @param int    $status   HTTP status code (0 for a transport error).
     * @param string $error    Error message, empty on success.
     * @return void
     */
    private function record_delivery(array $settings, int $status, string $error): void
    {
        $feed_id = isset($settings['_feed_id']) ? absint($settings['_feed_id']) : 0;
        if ($feed_id <= 0) {
            return;
        }

        try {
            $feed = ProviderModel::find($feed_id);
            if (! $feed) {
                return;
            }

            $feed_settings = is_array($feed->settings) ? $feed->settings : array();
            $feed_settings['last_delivery'] = array(
                'status'    => $status,
                'error'     => $error,
                'timestamp' => current_time('mysql'),
            );

            $feed->settings = $feed_settings;
            $feed->save();
        } catch (\Exception $e) {
            Debug::log('Streamery Forms Webhook: failed to record delivery status: ' . $e->getMessage());
        }
    }

    /**
     * Returns the field definitions for the settings.
     *
     * @return array Array of field definitions
     */
    public function get_settings_fields(): array
    {
        return array(
            array(
                'name'        => 'url',
                'label'       => __('Endpoint URL', 'streamery-forms'),
                'type'        => 'url',
                'required'    => true,
                'default'     => '',
                'description' => __('The https URL that submissions are sent to. Private and local addresses are blocked.', 'streamery-forms'),
                'placeholder' => 'https://example.com/hooks/streamery-forms',
            ),
            array(
                'name'     => 'method',
                'label'    => __('HTTP Method', 'streamery-forms'),
                'type'     => 'select',
                'required' => false,
                'default'  => 'POST',
                'options'  => array(
                    array('value' => 'POST', 'label' => 'POST'),
                    array('value' => 'PUT', 'label' => 'PUT'),
                    array('value' => 'PATCH', 'label' => 'PATCH'),
                ),
            ),
            array(
                'name'     => 'content_type',
                'label'    => __('Content Type', 'streamery-forms'),
                'type'     => 'select',
                'required' => false,
                'default'  => 'application/json',
                'options'  => array(
                    array('value' => 'application/json', 'label' => 'application/json'),
                    array('value' => 'application/x-www-form-urlencoded', 'label' => 'application/x-www-form-urlencoded'),
                ),
            ),
            array(
                'name'     => 'auth_type',
                'label'    => __('Authentication', 'streamery-forms'),
                'type'     => 'select',
                'required' => false,
                'default'  => 'none',
                'options'  => array(
                    array('value' => 'none', 'label' => __('None', 'streamery-forms')),
                    array('value' => 'bearer', 'label' => __('Bearer token', 'streamery-forms')),
                    array('value' => 'api_key', 'label' => __('API key header', 'streamery-forms')),
                    array('value' => 'basic', 'label' => __('Basic auth', 'streamery-forms')),
                ),
            ),
            array(
                'name'        => 'auth_token',
                'label'       => __('Bearer Token', 'streamery-forms'),
                'type'        => 'password',
                'required'    => false,
                'default'     => '',
                'is_secret'   => true,
                'description' => __('Sent as an Authorization: Bearer header.', 'streamery-forms'),
            ),
            array(
                'name'        => 'api_key_header',
                'label'       => __('API Key Header Name', 'streamery-forms'),
                'type'        => 'text',
                'required'    => false,
                'default'     => 'X-API-Key',
                'description' => __('Letters, digits and hyphens only.', 'streamery-forms'),
            ),
            array(
                'name'      => 'api_key',
                'label'     => __('API Key', 'streamery-forms'),
                'type'      => 'password',
                'required'  => false,
                'default'   => '',
                'is_secret' => true,
            ),
            array(
                'name'     => 'auth_user',
                'label'    => __('Basic Auth Username', 'streamery-forms'),
                'type'     => 'text',
                'required' => false,
                'default'  => '',
            ),
            array(
                'name'      => 'auth_password',
                'label'     => __('Basic Auth Password', 'streamery-forms'),
                'type'      => 'password',
                'required'  => false,
                'default'   => '',
                'is_secret' => true,
            ),
            array(
                'name'        => 'sign_payload',
                'label'       => __('Sign payload (HMAC)', 'streamery-forms'),
                'type'        => 'checkbox',
                'required'    => false,
                'default'     => false,
                'description' => __('Adds X-Streamery-Forms-Timestamp and X-Streamery-Forms-Signature headers so the receiver can verify the payload.', 'streamery-forms'),
            ),
            array(
                'name'        => 'secret',
                'label'       => __('Signing Secret', 'streamery-forms'),
                'type'        => 'password',
                'required'    => false,
                'default'     => '',
                'is_secret'   => true,
                'description' => __('Used for the HMAC signature: sha256 over "<timestamp>.<body>".', 'streamery-forms'),
            ),
            array(
                'name'        => 'custom_headers',
                'label'       => __('Custom Headers', 'streamery-forms'),
                'type'        => 'repeater',
                'required'    => false,
                'default'     => array(),
                'description' => __('Additional headers sent with every request.', 'streamery-forms'),
                'fields'      => array(
                    array('name' => 'key', 'label' => __('Header', 'streamery-forms'), 'type' => 'text'),
                    array('name' => 'value', 'label' => __('Value', 'streamery-forms'), 'type' => 'text'),
                ),
            ),
            array(
                'name'        => 'timeout',
                'label'       => __('Timeout (seconds)', 'streamery-forms'),
                'type'        => 'number',
                'required'    => false,
                'default'     => self::DEFAULT_TIMEOUT,
                'description' => __('Maximum 15 seconds.', 'streamery-forms'),
            ),
            array(
                'name'                => 'field_map',
                'label'               => __('Field Mapping', 'streamery-forms'),
                'type'                => 'field_map',
                'required'            => false,
                'default'             => array(),
                'description'         => __('Map form fields to payload keys. Dot paths create nested objects (e.g. contact.email). Leave empty to send all fields unchanged.', 'streamery-forms'),
                // The mapping is the one thing a single form may change -- never the URL or credentials.
                'allow_form_override' => true,
            ),
        );
    }
}
