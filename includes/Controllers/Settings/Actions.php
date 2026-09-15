<?php
/**
 * Settings Controller
 *
 * This file is used to register all actions for the Settings Controller.
 *
 * @since 1.0.0
 */

namespace StreameryForms\Controllers\Settings;

use StreameryForms\Core\Debug;
use StreameryForms\Core\Crypto;
use StreameryForms\Admin\AdminBar;

defined('ABSPATH') || exit;

class Actions
{
	/**
	 * Get SMTP settings
	 *
	 * @return array
	 */
	public function get_smtp_settings()
	{
		// Check user capabilities
		if (!current_user_can('manage_options')) {
			return new \WP_Error(
				'rest_forbidden',
				__('You do not have permission to view SMTP settings.', 'streamery-forms'),
				array('status' => 403)
			);
		}

		$settings = get_option('streamery_forms_smtp_settings', array());

		// Return default values if settings don't exist
		$defaults = array(
			'enabled' => false,
			'host' => '',
			'port' => '587',
			'encryption' => 'tls',
			'auth' => true,
			'username' => '',
			'password' => '', // Never return actual password for security
			'from_email' => get_option('admin_email'),
			'from_name' => get_bloginfo('name'),
			'email_logging' => false,
		);

		$merged = wp_parse_args($settings, $defaults);
		
		// Always remove password from response for security
		$merged['password'] = '';

		return array(
			'success' => true,
			'data' => $merged,
		);
	}

	/**
	 * Save SMTP settings
	 *
	 * @param \WP_REST_Request $request
	 * @return array
	 */
	public function save_smtp_settings(\WP_REST_Request $request)
	{
		// Verify nonce
		$nonce = $request->get_header('X-WP-Nonce');
		if (!$nonce || !wp_verify_nonce($nonce, 'wp_rest')) {
			return new \WP_Error(
				'rest_forbidden',
				__('Security check failed.', 'streamery-forms'),
				array('status' => 403)
			);
		}

		// Check user capabilities
		if (!current_user_can('manage_options')) {
			return new \WP_Error(
				'rest_forbidden',
				__('You do not have permission to manage settings.', 'streamery-forms'),
				array('status' => 403)
			);
		}

		$params = $request->get_json_params();

		// Sanitize and validate settings
		$settings = array(
			'enabled' => isset($params['enabled']) ? (bool) $params['enabled'] : false,
			'host' => isset($params['host']) ? sanitize_text_field($params['host']) : '',
			'port' => isset($params['port']) ? absint($params['port']) : 587,
			'encryption' => isset($params['encryption']) ? sanitize_text_field($params['encryption']) : 'tls',
			'auth' => isset($params['auth']) ? (bool) $params['auth'] : true,
			'username' => isset($params['username']) ? sanitize_text_field($params['username']) : '',
			'password' => isset($params['password']) ? sanitize_text_field($params['password']) : '',
			'from_email' => isset($params['from_email']) ? sanitize_email($params['from_email']) : get_option('admin_email'),
			'from_name' => isset($params['from_name']) ? sanitize_text_field($params['from_name']) : get_bloginfo('name'),
			'email_logging' => isset($params['email_logging']) ? (bool) $params['email_logging'] : false,
		);

		// Validate required fields if enabled
		if ($settings['enabled']) {
			if (empty($settings['host'])) {
				return new \WP_Error(
					'invalid_settings',
					__('SMTP host is required when SMTP is enabled.', 'streamery-forms'),
					array('status' => 400)
				);
			}

			if ($settings['auth'] && empty($settings['username'])) {
				return new \WP_Error(
					'invalid_settings',
					__('SMTP username is required when authentication is enabled.', 'streamery-forms'),
					array('status' => 400)
				);
			}

			if (!is_email($settings['from_email'])) {
				return new \WP_Error(
					'invalid_settings',
					__('Invalid from email address.', 'streamery-forms'),
					array('status' => 400)
				);
			}
		}

		// Encrypt password if provided
		if (!empty($settings['password'])) {
			// Only update password if a new one is provided
			$settings['password'] = Crypto::encrypt($settings['password']);
		} else {
			// Keep existing password if not provided
			$existing = get_option('streamery_forms_smtp_settings', array());
			if (isset($existing['password'])) {
				$settings['password'] = $existing['password'];
			}
		}

		// Save settings
		// Note: update_option returns false if the value hasn't changed, which is not an error
		try {
			update_option('streamery_forms_smtp_settings', $settings, false);
			
			// Always return success if we got this far (no validation errors)
			// update_option is reliable in WordPress
			$saved_settings = $this->get_smtp_settings();
			
			return array(
				'success' => true,
				'message' => __('SMTP settings saved successfully.', 'streamery-forms'),
				'data' => $saved_settings,
			);
		} catch (\Exception $e) {
			return new \WP_Error(
				'save_failed',
				__('Failed to save SMTP settings: ', 'streamery-forms') . $e->getMessage(),
				array('status' => 500)
			);
		}
	}

	/**
	 * Test SMTP connection
	 *
	 * @param \WP_REST_Request $request
	 * @return array
	 */
	public function test_smtp_connection(\WP_REST_Request $request)
	{
		// Verify nonce
		$nonce = $request->get_header('X-WP-Nonce');
		if (!$nonce || !wp_verify_nonce($nonce, 'wp_rest')) {
			return new \WP_Error(
				'rest_forbidden',
				__('Security check failed.', 'streamery-forms'),
				array('status' => 403)
			);
		}

		// Check user capabilities
		if (!current_user_can('manage_options')) {
			return new \WP_Error(
				'rest_forbidden',
				__('You do not have permission to test SMTP settings.', 'streamery-forms'),
				array('status' => 403)
			);
		}

		// Get parameters from request
		$params = $request->get_json_params();
		
		// Use settings from request if provided, otherwise use saved settings
		if (isset($params['settings']) && is_array($params['settings'])) {
			$test_settings = $params['settings'];
		} else {
			$saved_settings = $this->get_smtp_settings();
			$test_settings = $saved_settings['data'];
		}

		// Check if SMTP is enabled
		if (empty($test_settings['enabled'])) {
			return new \WP_Error(
				'smtp_disabled',
				__('SMTP is not enabled.', 'streamery-forms'),
				array('status' => 400)
			);
		}

		// Get test email from request or use admin email
		$test_email_raw = isset($params['test_email']) ? trim($params['test_email']) : '';
		
		// If no test email provided, use admin email as fallback
		if (empty($test_email_raw)) {
			$test_email_raw = get_option('admin_email');
		}
		
		// Validate email before sanitizing
		if (empty($test_email_raw) || !is_email($test_email_raw)) {
			return new \WP_Error(
				'invalid_email',
				__('Invalid test email address. Please provide a valid email address.', 'streamery-forms'),
				array('status' => 400)
			);
		}
		
		// Sanitize the email
		$test_email = sanitize_email($test_email_raw);
		
		// Double-check after sanitization
		if (empty($test_email) || !is_email($test_email)) {
			return new \WP_Error(
				'invalid_email',
				sprintf(
					/* translators: %s: the email address that failed validation. */
					__('Invalid test email address after sanitization: %s', 'streamery-forms'),
					$test_email_raw
				),
				array('status' => 400)
			);
		}

		// Temporarily configure SMTP settings for this test
		$original_settings = get_option('streamery_forms_smtp_settings', array());
		
		// Validate from_email first
		$from_email = isset($test_settings['from_email']) ? sanitize_email($test_settings['from_email']) : '';
		if (empty($from_email) || !is_email($from_email)) {
			// Try to get from admin email as fallback
			$from_email = get_option('admin_email');
			if (empty($from_email) || !is_email($from_email)) {
				return new \WP_Error(
					'invalid_from_email',
					__('Invalid from email address. Please provide a valid email address in the From Email field.', 'streamery-forms'),
					array('status' => 400)
				);
			}
		}
		
		// Prepare test settings (decode password if it's encoded)
		$temp_settings = array(
			'enabled' => (bool) $test_settings['enabled'],
			'host' => sanitize_text_field($test_settings['host'] ?? ''),
			'port' => absint($test_settings['port'] ?? 587),
			'encryption' => sanitize_text_field($test_settings['encryption'] ?? 'tls'),
			'auth' => (bool) ($test_settings['auth'] ?? true),
			'username' => sanitize_text_field($test_settings['username'] ?? ''),
			'from_email' => $from_email,
			'from_name' => sanitize_text_field($test_settings['from_name'] ?? get_bloginfo('name')),
		);
		
		// Handle password - if it's a new password, encrypt it; otherwise use existing
		if (!empty($test_settings['password'])) {
			$temp_settings['password'] = Crypto::encrypt($test_settings['password']);
		} elseif (isset($original_settings['password'])) {
			$temp_settings['password'] = $original_settings['password'];
		} else {
			$temp_settings['password'] = '';
		}
		
		// Temporarily save test settings
		update_option('streamery_forms_smtp_settings', $temp_settings, false);

		// Validate from_email before sending
		$from_email = sanitize_email($temp_settings['from_email']);
		if (empty($from_email) || !is_email($from_email)) {
			// Restore original settings
			update_option('streamery_forms_smtp_settings', $original_settings, false);
			
			return new \WP_Error(
				'invalid_from_email',
				__('Invalid from email address. Please provide a valid email address.', 'streamery-forms'),
				array('status' => 400)
			);
		}

		// Validate test_email one more time before sending
		if (empty($test_email) || !is_email($test_email)) {
			// Restore original settings
			update_option('streamery_forms_smtp_settings', $original_settings, false);
			
			return new \WP_Error(
				'invalid_test_email',
				__('Invalid test email address. Please provide a valid email address.', 'streamery-forms'),
				array('status' => 400)
			);
		}

		// Send test email with proper headers
		$subject = __('Streamery Forms SMTP Test Email', 'streamery-forms');
		$message = __('This is a test email from Streamery Forms SMTP settings.', 'streamery-forms');
		
		// Set email headers to ensure from_email is used
		$headers = array();
		$headers[] = 'From: ' . $temp_settings['from_name'] . ' <' . $from_email . '>';
		$headers[] = 'Reply-To: ' . $from_email;
		$headers[] = 'Content-Type: text/html; charset=UTF-8';

		Debug::log(sprintf(
				'Streamery Forms SMTP Test: Sending test email to %s from %s',
				$test_email,
				$from_email
			));

		// Capture PHPMailer errors
		global $phpmailer;
		$error_message = '';
		$error_captured = false;
		
		// Hook into wp_mail_failed to capture error details
		$error_handler = function($wp_error) use (&$error_message, &$error_captured) {
			$error_message = $wp_error->get_error_message();
			$error_captured = true;
		};
		add_action('wp_mail_failed', $error_handler, 10, 1);

		// Ensure test_email is not empty before calling wp_mail
		if (empty($test_email)) {
			// Restore original settings
			update_option('streamery_forms_smtp_settings', $original_settings, false);
			
			return new \WP_Error(
				'empty_test_email',
				__('Test email address is empty. Please provide a valid email address.', 'streamery-forms'),
				array('status' => 400)
			);
		}

		// Ensure test_email is a string, not an array
		if (is_array($test_email)) {
			$test_email = implode(',', $test_email);
		}
		
		// Final validation
		if (empty($test_email) || !is_email($test_email)) {
			// Restore original settings
			update_option('streamery_forms_smtp_settings', $original_settings, false);
			
			return new \WP_Error(
				'invalid_test_email_final',
				sprintf(
					/* translators: %s: the email address that failed validation. */
					__('Invalid test email address before sending: %s', 'streamery-forms'),
					$test_email
				),
				array('status' => 400)
			);
		}

		Debug::log(sprintf(
				'Streamery Forms SMTP Test: Calling wp_mail() with to=%s, subject=%s, headers=%s',
				$test_email,
				$subject,
				implode(' | ', $headers)
			));

		$result = wp_mail($test_email, $subject, $message, $headers);
		
		// Remove the error handler
		remove_action('wp_mail_failed', $error_handler, 10);
		
		// Restore original settings
		update_option('streamery_forms_smtp_settings', $original_settings, false);

		if ($result) {
			return array(
				'success' => true,
				'message' => sprintf(
					/* translators: %s: recipient email address. */
					__('Test email sent successfully to %s.', 'streamery-forms'),
					$test_email
				),
			);
		}

		// Get detailed error message
		$detailed_error = '';
		if ($error_captured && !empty($error_message)) {
			$detailed_error = $error_message;
		} elseif (isset($phpmailer) && is_object($phpmailer) && !empty($phpmailer->ErrorInfo)) {
			$detailed_error = $phpmailer->ErrorInfo;
		} else {
			$detailed_error = __('Failed to send test email. Please check your SMTP settings, credentials, and server configuration.', 'streamery-forms');
		}

		return new \WP_Error(
			'test_failed',
			$detailed_error,
			array('status' => 500)
		);
	}

	/**
	 * Get CAPTCHA settings. Secret keys are never returned -- masked instead,
	 * matching the SMTP password pattern.
	 *
	 * @return array|\WP_Error
	 */
	public function get_captcha_settings()
	{
		if (!current_user_can('manage_options')) {
			return new \WP_Error(
				'rest_forbidden',
				__('You do not have permission to view CAPTCHA settings.', 'streamery-forms'),
				array('status' => 403)
			);
		}

		$settings = get_option('streamery_forms_captcha_settings', array());
		$masked   = array();

		foreach (array('recaptcha', 'friendlycaptcha') as $provider) {
			$provider_settings = is_array($settings[$provider] ?? null) ? $settings[$provider] : array();
			$masked[$provider]  = array(
				'enabled'    => !empty($provider_settings['enabled']),
				'site_key'   => $provider_settings['site_key'] ?? '',
				'secret_key' => !empty($provider_settings['secret_key']) ? '••••••••' : '',
			);
		}

		return array(
			'success' => true,
			'data'    => $masked,
		);
	}

	/**
	 * Save CAPTCHA settings.
	 *
	 * @param \WP_REST_Request $request
	 * @return array|\WP_Error
	 */
	public function save_captcha_settings(\WP_REST_Request $request)
	{
		$nonce = $request->get_header('X-WP-Nonce');
		if (!$nonce || !wp_verify_nonce($nonce, 'wp_rest')) {
			return new \WP_Error(
				'rest_forbidden',
				__('Security check failed.', 'streamery-forms'),
				array('status' => 403)
			);
		}

		if (!current_user_can('manage_options')) {
			return new \WP_Error(
				'rest_forbidden',
				__('You do not have permission to manage CAPTCHA settings.', 'streamery-forms'),
				array('status' => 403)
			);
		}

		$params   = $request->get_json_params();
		$existing = get_option('streamery_forms_captcha_settings', array());
		$settings = array();

		foreach (array('recaptcha', 'friendlycaptcha') as $provider) {
			$incoming = is_array($params[$provider] ?? null) ? $params[$provider] : array();
			$current  = is_array($existing[$provider] ?? null) ? $existing[$provider] : array();

			$secret_key = $current['secret_key'] ?? '';
			if (!empty($incoming['secret_key'])) {
				// A masked value (dots) coming back from the client means "unchanged".
				$submitted = sanitize_text_field($incoming['secret_key']);
				if (false === strpos($submitted, '•')) {
					$secret_key = Crypto::encrypt($submitted);
				}
			}

			$settings[$provider] = array(
				'enabled'    => !empty($incoming['enabled']),
				'site_key'   => isset($incoming['site_key']) ? sanitize_text_field($incoming['site_key']) : ($current['site_key'] ?? ''),
				'secret_key' => $secret_key,
			);
		}

		update_option('streamery_forms_captcha_settings', $settings, false);

		return array(
			'success' => true,
			'message' => __('CAPTCHA settings saved successfully.', 'streamery-forms'),
			'data'    => $this->get_captcha_settings(),
		);
	}

	/**
	 * Get debug mode status
	 *
	 * @return array
	 */
	public function get_debug_status()
	{
		// Check user capabilities
		if (!current_user_can('manage_options')) {
			return new \WP_Error(
				'rest_forbidden',
				__('You do not have permission to view debug settings.', 'streamery-forms'),
				array('status' => 403)
			);
		}

		return array(
			'success' => true,
			'enabled' => Debug::is_enabled(),
		);
	}

	/**
	 * Update debug mode status
	 *
	 * @param \WP_REST_Request $request
	 * @return array
	 */
	public function update_debug_status(\WP_REST_Request $request)
	{
		// Verify nonce
		$nonce = $request->get_header('X-WP-Nonce');
		if (!$nonce || !wp_verify_nonce($nonce, 'wp_rest')) {
			return new \WP_Error(
				'rest_forbidden',
				__('Security check failed.', 'streamery-forms'),
				array('status' => 403)
			);
		}

		// Check user capabilities
		if (!current_user_can('manage_options')) {
			return new \WP_Error(
				'rest_forbidden',
				__('You do not have permission to manage debug settings.', 'streamery-forms'),
				array('status' => 403)
			);
		}

		$params = $request->get_json_params();
		$enabled = isset($params['enabled']) ? (bool) $params['enabled'] : false;

		if ($enabled) {
			$result = Debug::enable();
		} else {
			$result = Debug::disable();
		}

		if ($result) {
			return array(
				'success' => true,
				'message' => $enabled 
					? __('Debug mode enabled.', 'streamery-forms')
					: __('Debug mode disabled.', 'streamery-forms'),
				'enabled' => Debug::is_enabled(),
			);
		}

		return new \WP_Error(
			'update_failed',
			__('Failed to update debug mode.', 'streamery-forms'),
			array('status' => 500)
		);
	}

	/**
	 * Get skip first steps status
	 *
	 * @return array
	 */
	public function get_skip_first_steps()
	{
		// Check user capabilities
		if (!current_user_can('manage_options')) {
			return new \WP_Error(
				'rest_forbidden',
				__('You do not have permission to view settings.', 'streamery-forms'),
				array('status' => 403)
			);
		}

		$skipped = get_user_meta(get_current_user_id(), 'streamery_forms_skip_first_steps', true);

		return array(
			'success' => true,
			'skipped' => (bool) $skipped,
		);
	}

	/**
	 * Update skip first steps status
	 *
	 * @param \WP_REST_Request $request
	 * @return array
	 */
	public function update_skip_first_steps(\WP_REST_Request $request)
	{
		// Verify nonce
		$nonce = $request->get_header('X-WP-Nonce');
		if (!$nonce || !wp_verify_nonce($nonce, 'wp_rest')) {
			return new \WP_Error(
				'rest_forbidden',
				__('Security check failed.', 'streamery-forms'),
				array('status' => 403)
			);
		}

		// Check user capabilities
		if (!current_user_can('manage_options')) {
			return new \WP_Error(
				'rest_forbidden',
				__('You do not have permission to manage settings.', 'streamery-forms'),
				array('status' => 403)
			);
		}

		$params = $request->get_json_params();
		$skipped = isset($params['skipped']) ? (bool) $params['skipped'] : false;

		update_user_meta(get_current_user_id(), 'streamery_forms_skip_first_steps', $skipped ? '1' : '');

		return array(
			'success' => true,
			'message' => $skipped 
				? __('First steps skipped.', 'streamery-forms')
				: __('First steps re-enabled.', 'streamery-forms'),
			'skipped' => $skipped,
		);
	}

	/**
	 * Get charts visibility status
	 *
	 * @return array
	 */
	public function get_charts_visible()
	{
		// Check user capabilities
		if (!current_user_can('manage_options')) {
			return new \WP_Error(
				'rest_forbidden',
				__('You do not have permission to view settings.', 'streamery-forms'),
				array('status' => 403)
			);
		}

		$visible = get_user_meta(get_current_user_id(), 'streamery_forms_charts_visible', true);
		// Default to true if not set
		if ($visible === '') {
			$visible = true;
		} else {
			$visible = (bool) $visible;
		}

		return array(
			'success' => true,
			'visible' => $visible,
		);
	}

	/**
	 * Update charts visibility status
	 *
	 * @param \WP_REST_Request $request
	 * @return array
	 */
	public function update_charts_visible(\WP_REST_Request $request)
	{
		// Verify nonce
		$nonce = $request->get_header('X-WP-Nonce');
		if (!$nonce || !wp_verify_nonce($nonce, 'wp_rest')) {
			return new \WP_Error(
				'rest_forbidden',
				__('Security check failed.', 'streamery-forms'),
				array('status' => 403)
			);
		}

		// Check user capabilities
		if (!current_user_can('manage_options')) {
			return new \WP_Error(
				'rest_forbidden',
				__('You do not have permission to manage settings.', 'streamery-forms'),
				array('status' => 403)
			);
		}

		$params = $request->get_json_params();
		$visible = isset($params['visible']) ? (bool) $params['visible'] : true;

		update_user_meta(get_current_user_id(), 'streamery_forms_charts_visible', $visible ? '1' : '');

		return array(
			'success' => true,
			'message' => $visible 
				? __('Charts are now visible.', 'streamery-forms')
				: __('Charts are now hidden.', 'streamery-forms'),
			'visible' => $visible,
		);
	}

	/**
	 * Dismiss the "Support Streamery Forms" prompt for the current user.
	 *
	 * @param \WP_REST_Request $request
	 * @return array|\WP_Error
	 */
	public function update_support_dismissed(\WP_REST_Request $request)
	{
		// Verify nonce
		$nonce = $request->get_header('X-WP-Nonce');
		if (!$nonce || !wp_verify_nonce($nonce, 'wp_rest')) {
			return new \WP_Error(
				'rest_forbidden',
				__('Security check failed.', 'streamery-forms'),
				array('status' => 403)
			);
		}

		// Check user capabilities
		if (!current_user_can('manage_options')) {
			return new \WP_Error(
				'rest_forbidden',
				__('You do not have permission to manage settings.', 'streamery-forms'),
				array('status' => 403)
			);
		}

		$params = $request->get_json_params();
		$dismissed = isset($params['dismissed']) ? (bool) $params['dismissed'] : true;

		update_user_meta(get_current_user_id(), \StreameryForms\Admin\Support::DISMISSED_META_KEY, $dismissed ? '1' : '');

		return array(
			'success'   => true,
			'dismissed' => $dismissed,
		);
	}

	/**
	 * Get the "delete all data on uninstall" opt-in.
	 *
	 * @return array|\WP_Error
	 */
	public function get_delete_data_on_uninstall()
	{
		if (!current_user_can('manage_options')) {
			return new \WP_Error(
				'rest_forbidden',
				__('You do not have permission to view settings.', 'streamery-forms'),
				array('status' => 403)
			);
		}

		return array(
			'success' => true,
			'enabled' => (bool) get_option('streamery_forms_delete_data_on_uninstall', false),
		);
	}

	/**
	 * Update the "delete all data on uninstall" opt-in.
	 *
	 * Off by default: deleting the plugin must not silently destroy a site's
	 * form submissions. See uninstall.php.
	 *
	 * @param \WP_REST_Request $request
	 * @return array|\WP_Error
	 */
	public function update_delete_data_on_uninstall(\WP_REST_Request $request)
	{
		$nonce = $request->get_header('X-WP-Nonce');
		if (!$nonce || !wp_verify_nonce($nonce, 'wp_rest')) {
			return new \WP_Error(
				'rest_forbidden',
				__('Security check failed.', 'streamery-forms'),
				array('status' => 403)
			);
		}

		if (!current_user_can('manage_options')) {
			return new \WP_Error(
				'rest_forbidden',
				__('You do not have permission to manage settings.', 'streamery-forms'),
				array('status' => 403)
			);
		}

		$params  = $request->get_json_params();
		$enabled = isset($params['enabled']) ? (bool) $params['enabled'] : false;

		update_option('streamery_forms_delete_data_on_uninstall', $enabled ? '1' : '', false);

		return array(
			'success' => true,
			'message' => $enabled
				? __('All Streamery Forms data will be deleted when the plugin is deleted.', 'streamery-forms')
				: __('Streamery Forms data will be kept when the plugin is deleted.', 'streamery-forms'),
			'enabled' => $enabled,
		);
	}

	/**
	 * Get admin bar visibility status
	 *
	 * @return array|\WP_Error
	 */
	public function get_admin_bar_enabled()
	{
		// Check user capabilities
		if (!current_user_can('manage_options')) {
			return new \WP_Error(
				'rest_forbidden',
				__('You do not have permission to view settings.', 'streamery-forms'),
				array('status' => 403)
			);
		}

		return array(
			'success' => true,
			'enabled' => AdminBar::is_enabled(),
		);
	}

	/**
	 * Update admin bar visibility status
	 *
	 * @param \WP_REST_Request $request
	 * @return array|\WP_Error
	 */
	public function update_admin_bar_enabled(\WP_REST_Request $request)
	{
		// Verify nonce
		$nonce = $request->get_header('X-WP-Nonce');
		if (!$nonce || !wp_verify_nonce($nonce, 'wp_rest')) {
			return new \WP_Error(
				'rest_forbidden',
				__('Security check failed.', 'streamery-forms'),
				array('status' => 403)
			);
		}

		// Check user capabilities
		if (!current_user_can('manage_options')) {
			return new \WP_Error(
				'rest_forbidden',
				__('You do not have permission to manage settings.', 'streamery-forms'),
				array('status' => 403)
			);
		}

		$params = $request->get_json_params();
		$enabled = isset($params['enabled']) ? (bool) $params['enabled'] : true;

		update_option(AdminBar::OPTION_KEY, $enabled ? '1' : '', false);

		return array(
			'success' => true,
			'message' => $enabled
				? __('Admin bar menu enabled.', 'streamery-forms')
				: __('Admin bar menu disabled.', 'streamery-forms'),
			'enabled' => $enabled,
		);
	}
}

