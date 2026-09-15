<?php

/**
 * Spam Protection
 *
 * Server-side checks for the public /submit endpoint: honeypot, a minimum
 * render-to-submit time, per-IP rate limiting, and CAPTCHA verification
 * (reCAPTCHA v3 / FriendlyCaptcha). All of this used to live only in the
 * browser (or not at all), which means it protected against nothing --
 * anyone can POST straight to the REST endpoint.
 *
 * @package StreameryForms\Core
 * @since 1.0.0
 */

namespace StreameryForms\Core;

defined('ABSPATH') || exit;

/**
 * Class SpamProtection
 */
class SpamProtection
{
	/**
	 * Honeypot field names are always prefixed with this marker (see the
	 * honeypot block's save.tsx), so this can be checked without knowing a
	 * given form's field schema.
	 */
	public const HONEYPOT_PREFIX = 'streamery_forms_honeypot_';

	/**
	 * Minimum seconds allowed to pass between the form rendering and the
	 * submit request. Filterable; bots that submit near-instantly get caught here.
	 */
	private const MIN_SUBMIT_SECONDS = 2;

	/**
	 * Runs every server-side spam check. Returns null when the submission may
	 * proceed, or a WP_Error describing why it was rejected.
	 *
	 * @param array $submission_data Raw submission_data (still needs sanitizing by the caller).
	 * @param int   $rendered_at     Client-supplied unix timestamp (ms) of when the form rendered.
	 * @return \WP_Error|null
	 */
	public function check(array $submission_data, int $rendered_at, array $form_settings = array()): ?\WP_Error
	{
		$spam_settings = $form_settings['spam_protection'] ?? array();

		// Rate limiting and submit timing are not per-form opt-outs: they cost
		// a legitimate visitor nothing and are the cheapest defence available.
		$rate_limit_error = $this->check_rate_limit();
		if (null !== $rate_limit_error) {
			return $rate_limit_error;
		}

		$honeypot_enabled = ! isset($spam_settings['honeypot']) || (bool) $spam_settings['honeypot'];

		if ($honeypot_enabled && $this->is_honeypot_filled($submission_data)) {
			// Don't tell a bot why it failed -- generic rejection.
			return new \WP_Error('spam_rejected', __('Submission rejected.', 'streamery-forms'), array('status' => 400));
		}

		if (! $this->is_submit_timing_valid($rendered_at)) {
			return new \WP_Error('spam_rejected', __('Submission rejected.', 'streamery-forms'), array('status' => 400));
		}

		return null;
	}

	/**
	 * Removes honeypot and CAPTCHA response fields from submission_data so
	 * they never get stored as if they were real form fields.
	 *
	 * @param array $submission_data Raw submission_data.
	 * @return array
	 */
	public function strip_spam_fields(array $submission_data): array
	{
		foreach (array_keys($submission_data) as $key) {
			if (0 === strpos($key, self::HONEYPOT_PREFIX)) {
				unset($submission_data[$key]);
			}
		}

		unset($submission_data['g-recaptcha-response'], $submission_data['frc-captcha-response']);

		return $submission_data;
	}

	/**
	 * Per-IP rate limiting via transients: 10 requests/minute, 50/hour by default.
	 *
	 * @return \WP_Error|null
	 */
	private function check_rate_limit(): ?\WP_Error
	{
		$ip = $this->get_client_ip();
		if ('' === $ip) {
			// Can't identify the requester -- fail open on rate limiting alone,
			// the other checks (honeypot/timing/captcha) still apply.
			return null;
		}

		$limits = apply_filters('streamery-forms/submit/rate_limits', array(
			array(
				'window'   => MINUTE_IN_SECONDS,
				'max'      => 10,
				'transient_suffix' => 'm',
			),
			array(
				'window'   => HOUR_IN_SECONDS,
				'max'      => 50,
				'transient_suffix' => 'h',
			),
		));

		foreach ($limits as $limit) {
			$key   = 'streamery_forms_rl_' . $limit['transient_suffix'] . '_' . md5($ip);
			$count = (int) get_transient($key);

			if ($count >= (int) $limit['max']) {
				return new \WP_Error(
					'rate_limited',
					__('Too many submissions. Please try again later.', 'streamery-forms'),
					array('status' => 429)
				);
			}

			if (0 === $count) {
				set_transient($key, 1, (int) $limit['window']);
			} else {
				set_transient($key, $count + 1, (int) $limit['window']);
			}
		}

		return null;
	}

	/**
	 * True if any honeypot-marked field carries a non-empty value.
	 *
	 * @param array $submission_data Raw submission_data.
	 * @return bool
	 */
	private function is_honeypot_filled(array $submission_data): bool
	{
		foreach ($submission_data as $key => $value) {
			if (0 !== strpos((string) $key, self::HONEYPOT_PREFIX)) {
				continue;
			}
			if (is_array($value) ? ! empty($value) : '' !== trim((string) $value)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * True if enough time passed between the form rendering and this request.
	 *
	 * @param int $rendered_at Client-supplied unix timestamp in milliseconds.
	 * @return bool
	 */
	private function is_submit_timing_valid(int $rendered_at): bool
	{
		if ($rendered_at <= 0) {
			// No timestamp supplied (e.g. very old cached markup) -- don't
			// penalize legitimate visitors for a missing optional signal.
			return true;
		}

		$elapsed_seconds = (time() * 1000 - $rendered_at) / 1000;
		$min_seconds     = (int) apply_filters('streamery-forms/submit/min_seconds', self::MIN_SUBMIT_SECONDS);

		return $elapsed_seconds >= $min_seconds;
	}

	/**
	 * Verifies a CAPTCHA response found in submission_data against the
	 * configured provider's secret. Returns true when no CAPTCHA is
	 * configured/enabled (nothing to verify), so this is safe to always call.
	 *
	 * @param array $submission_data Raw submission_data.
	 * @return bool
	 */
	public function verify_captcha(array $submission_data, array $form_settings = array()): bool
	{
		$spam_settings = $form_settings['spam_protection'] ?? array();

		// A form can switch CAPTCHA off; it cannot switch it on for a provider
		// the site has not configured (there'd be no secret to verify against).
		if (isset($spam_settings['captcha']) && ! $spam_settings['captcha']) {
			return true;
		}

		$settings = get_option('streamery_forms_captcha_settings', array());

		$recaptcha = $settings['recaptcha'] ?? array();
		if (! empty($recaptcha['enabled']) && ! empty($recaptcha['secret_key'])) {
			$token = $submission_data['g-recaptcha-response'] ?? '';
			return $this->verify_recaptcha((string) $token, (string) $recaptcha['secret_key']);
		}

		$friendly = $settings['friendlycaptcha'] ?? array();
		if (! empty($friendly['enabled']) && ! empty($friendly['secret_key'])) {
			$token = $submission_data['frc-captcha-response'] ?? '';
			return $this->verify_friendlycaptcha((string) $token, (string) $friendly['secret_key']);
		}

		return true;
	}

	/**
	 * @param string $token  g-recaptcha-response value.
	 * @param string $secret reCAPTCHA secret key.
	 * @return bool
	 */
	private function verify_recaptcha(string $token, string $secret): bool
	{
		if ('' === $token) {
			return false;
		}

		$response = wp_remote_post('https://www.google.com/recaptcha/api/siteverify', array(
			'timeout' => 10,
			'body'    => array(
				'secret'   => $secret,
				'response' => $token,
				'remoteip' => $this->get_client_ip(),
			),
		));

		if (is_wp_error($response)) {
			return false;
		}

		$body = json_decode(wp_remote_retrieve_body($response), true);

		return ! empty($body['success']);
	}

	/**
	 * @param string $token  frc-captcha-response value.
	 * @param string $secret FriendlyCaptcha secret/API key.
	 * @return bool
	 */
	private function verify_friendlycaptcha(string $token, string $secret): bool
	{
		if ('' === $token) {
			return false;
		}

		$response = wp_remote_post('https://api.friendlycaptcha.com/api/v1/siteverify', array(
			'timeout' => 10,
			'headers' => array('Content-Type' => 'application/json'),
			'body'    => wp_json_encode(array(
				'solution' => $token,
				'secret'   => $secret,
			)),
		));

		if (is_wp_error($response)) {
			return false;
		}

		$body = json_decode(wp_remote_retrieve_body($response), true);

		return ! empty($body['success']);
	}

	/**
	 * @return string
	 */
	private function get_client_ip(): string
	{
		$remote_addr = isset($_SERVER['REMOTE_ADDR'])
			? sanitize_text_field(wp_unslash($_SERVER['REMOTE_ADDR']))
			: '';

		return filter_var($remote_addr, FILTER_VALIDATE_IP) !== false ? $remote_addr : '';
	}
}
