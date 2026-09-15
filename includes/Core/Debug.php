<?php

/**
 * Debug Class
 *
 * Handles debug functionality for form submissions.
 *
 * @package StreameryForms\Core
 * @since 1.0.0
 */

namespace StreameryForms\Core;

defined('ABSPATH') || exit;

/**
 * Debug Class
 *
 * Provides debug functionality for form submissions.
 */
class Debug
{

    /**
     * Option name for debug mode.
     *
     * @var string
     */
    const OPTION_NAME = 'streamery_forms_debug_enabled';

    /**
     * Checks if debug mode is enabled.
     *
     * @return bool True if debug is enabled, false otherwise.
     */
    public static function is_enabled(): bool
    {
        // Only enable for logged-in users
        if (! is_user_logged_in()) {
            return false;
        }

        return (bool) get_option(self::OPTION_NAME, false);
    }

    /**
     * Writes a diagnostic line when WP_DEBUG is on.
     *
     * Plugin Check flags raw error_log() calls; this is the single gated sink.
     *
     * @param string $message Message.
     * @return void
     */
    public static function log(string $message): void
    {
        if (! defined('WP_DEBUG') || ! WP_DEBUG) {
            return;
        }

        // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- WP_DEBUG-only diagnostic sink.
        error_log($message);
    }

    /**
     * Enables debug mode.
     *
     * @return bool True on success, false on failure.
     */
    public static function enable(): bool
    {
        return update_option(self::OPTION_NAME, true);
    }

    /**
     * Disables debug mode.
     *
     * @return bool True on success, false on failure.
     */
    public static function disable(): bool
    {
        return update_option(self::OPTION_NAME, false);
    }

    /**
     * Collects debug data for a form submission.
     *
     * @param array  $submission_data The form submission data.
     * @param string $form_identifier The form identifier.
     * @param array  $provider_results The results from all providers.
     * @param array  $errors Any errors that occurred.
     * @return array Debug data array.
     */
    public static function collect_debug_data(
        array $submission_data,
        string $form_identifier,
        array $provider_results = array(),
        array $errors = array()
    ): array {
        $debug_data = array(
            'enabled'         => true,
            'timestamp'       => current_time('c'),
            'form_identifier' => $form_identifier,
            'providers'       => array(),
            'payload'         => self::sanitize_payload($submission_data),
            'errors'          => $errors,
            'results'         => $provider_results,
        );

        // Collect provider information
        $registry = \StreameryForms\Providers\Registry::get_instance();
        $providers = \StreameryForms\Models\Providers::where('is_active', true)->get();

        foreach ($providers as $provider_feed) {
            $provider = $registry->get_provider($provider_feed->provider_type);
            if ($provider) {
                $provider_status = 'not_executed';
                if (isset($provider_results[$provider_feed->provider_type])) {
                    $result = $provider_results[$provider_feed->provider_type];
                    $provider_status = isset($result['success']) && $result['success'] ? 'success' : 'failed';
                }

                $debug_data['providers'][] = array(
                    'slug'     => $provider_feed->provider_type,
                    'name'     => $provider->get_title(),
                    'feed_id'  => $provider_feed->id,
                    'feed_name' => $provider_feed->name,
                    'status'   => $provider_status,
                    'settings' => self::sanitize_settings($provider_feed->settings ?? array()),
                );
            }
        }

        return $debug_data;
    }

    /**
     * Sanitizes payload data for debug output.
     * Removes sensitive information like passwords.
     *
     * @param array $payload The submission payload.
     * @return array Sanitized payload.
     */
    private static function sanitize_payload(array $payload): array
    {
        $sanitized = array();
        $sensitive_keys = array('password', 'pass', 'pwd', 'secret', 'token', 'key');

        foreach ($payload as $key => $value) {
            $key_lower = strtolower($key);
            $is_sensitive = false;

            foreach ($sensitive_keys as $sensitive_key) {
                if (strpos($key_lower, $sensitive_key) !== false) {
                    $is_sensitive = true;
                    break;
                }
            }

            if ($is_sensitive) {
                $sanitized[$key] = '[REDACTED]';
            } elseif (is_array($value)) {
                $sanitized[$key] = self::sanitize_payload($value);
            } else {
                $sanitized[$key] = $value;
            }
        }

        return $sanitized;
    }

    /**
     * Sanitizes provider settings for debug output.
     * Removes sensitive information like API keys and passwords.
     *
     * @param array $settings Provider settings.
     * @return array Sanitized settings.
     */
    private static function sanitize_settings(array $settings): array
    {
        $sanitized = array();
        $sensitive_keys = array('password', 'pass', 'pwd', 'secret', 'token', 'key', 'api_key', 'apikey');

        foreach ($settings as $key => $value) {
            $key_lower = strtolower($key);
            $is_sensitive = false;

            foreach ($sensitive_keys as $sensitive_key) {
                if (strpos($key_lower, $sensitive_key) !== false) {
                    $is_sensitive = true;
                    break;
                }
            }

            if ($is_sensitive) {
                $sanitized[$key] = '[REDACTED]';
            } elseif (is_array($value)) {
                $sanitized[$key] = self::sanitize_settings($value);
            } else {
                $sanitized[$key] = $value;
            }
        }

        return $sanitized;
    }
}

