<?php
/**
 * Submission Actions Controller
 *
 * REST API controller for form submission handling.
 *
 * @package StreameryForms\Controllers\Submissions
 * @since 1.0.0
 */

namespace StreameryForms\Controllers\Submissions;

use StreameryForms\Core\FormRegistry;
use StreameryForms\Core\SpamProtection;
use StreameryForms\Core\UploadTokens;

defined( 'ABSPATH' ) || exit;

/**
 * Submission Actions Class
 *
 * Handles REST API requests for form submissions. This is one of only two
 * public (unauthenticated) routes in the plugin, so every value coming out of
 * the request is treated as hostile: sanitized, capped, validated against the
 * server-side field schema, and -- for file fields -- resolved only from
 * server-issued upload tokens, never from whatever attachment_id/url/path the
 * client happens to send.
 *
 * Which provider feeds run, with which settings and mail body, is likewise
 * resolved server-side from Core\FormRegistry. The request's provider_ids and
 * provider_overrides parameters are accepted but ignored, purely so an older
 * cached frontend script doesn't break.
 */
class Actions {

	/**
	 * Hard caps so a single request can't build an unbounded array in memory
	 * or an unbounded row in the database. Generous enough for any real form.
	 */
	private const MAX_FIELDS          = 200;
	private const MAX_ARRAY_ITEMS     = 200;
	private const MAX_FIELD_KEY_LEN   = 191; // matches typical MySQL index-safe varchar length.
	private const MAX_STRING_LEN      = 20000;

	/**
	 * Processes a form submission.
	 *
	 * @param \WP_REST_Request $request
	 * @return array|\WP_Error
	 */
	public function submit( \WP_REST_Request $request ) {
		// 1. Nonce verification
		$nonce = $request->get_header( 'X-WP-Nonce' );
		if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
			return new \WP_Error(
				'invalid_nonce',
				__( 'Invalid nonce.', 'streamery-forms' ),
				array( 'status' => 403 )
			);
		}

		// 2. Extract and sanitize data
		$raw_submission_data = $request->get_param( 'submission_data' );
		$raw_submission_data = is_array( $raw_submission_data ) ? $raw_submission_data : array();
		$submission_data     = $this->sanitize_submission_data( $raw_submission_data );

		$form_identifier = sanitize_text_field( $request->get_param( 'form_identifier' ) ?? '' );
		$rendered_at     = absint( $request->get_param( 'rendered_at' ) ?? 0 );

		// 3. Validation
		if ( empty( $form_identifier ) ) {
			return new \WP_Error(
				'missing_form_identifier',
				__( 'Form identifier is missing.', 'streamery-forms' ),
				array( 'status' => 400 )
			);
		}

		// Resolve the form's configuration server-side. Lazy-rebuilds the index
		// if this form has never been seen (content from an older version, a
		// widget, a template part, ...).
		$form_config = FormRegistry::get_instance()->get_form_config( $form_identifier );

		if ( null === $form_config ) {
			return new \WP_Error(
				'unknown_form',
				__( 'This form could not be found.', 'streamery-forms' ),
				array( 'status' => 404 )
			);
		}

		// 4. Server-side spam protection: rate limit, honeypot, submit timing, CAPTCHA.
		// Per-form toggles come from the server-side config, not the request.
		$form_settings   = $form_config['config']['settings'] ?? array();
		$spam_protection = new SpamProtection();

		$spam_error = $spam_protection->check( $submission_data, $rendered_at, $form_settings );
		if ( null !== $spam_error ) {
			return $spam_error;
		}

		if ( ! $spam_protection->verify_captcha( $submission_data, $form_settings ) ) {
			return new \WP_Error(
				'captcha_failed',
				__( 'CAPTCHA verification failed. Please try again.', 'streamery-forms' ),
				array( 'status' => 400 )
			);
		}

		$submission_data = $spam_protection->strip_spam_fields( $submission_data );

		// 5. Resolve file fields from their upload tokens -- never from client-supplied
		// attachment_id/url/path. Fields with a missing/expired/already-used token are
		// dropped rather than failing the whole submission.
		$submission_data = $this->resolve_file_fields( $submission_data );

		// 6. Validate against the server-side field schema: enforce required
		// fields, check select/radio/checkbox values against the options the
		// form actually offers, and drop fields the form doesn't define.
		$validator  = new FieldValidator();
		$validation = $validator->validate( $submission_data, $form_config['fields'] ?? array() );

		if ( ! empty( $validation['errors'] ) ) {
			return new \WP_Error(
				'validation_failed',
				__( 'Please check the highlighted fields.', 'streamery-forms' ),
				array(
					'status'       => 422,
					'field_errors' => $validation['errors'],
				)
			);
		}

		$submission_data = $validation['data'];

		// 7. Call Submission Handler with the server-resolved configuration.
		$handler = new Handler();
		$result  = $handler->process( $submission_data, $form_identifier, $form_config );

		// 8. Return response
		if ( $result['success'] ) {
			return array(
				'success' => true,
				'message' => __( 'Form submitted successfully.', 'streamery-forms' ),
				'data'    => $result,
			);
		} else {
			return new \WP_Error(
				'submission_failed',
				__( 'Form submission failed.', 'streamery-forms' ),
				array(
					'status'  => 500,
					'errors'  => $result['errors'],
					'results' => $result['results'],
				)
			);
		}
	}

	/**
	 * Defensively sanitizes submission_data without knowledge of the form's
	 * field schema (that lookup is Phase 2 -- see FormRegistry in the project
	 * plan). Caps field/array/string sizes, strips tags from scalar values,
	 * and preserves the file-field shape (array of {token,...}) so
	 * resolve_file_fields() can process it next.
	 *
	 * @param array $data Raw submission_data from the request.
	 * @return array
	 */
	private function sanitize_submission_data( array $data ): array {
		$sanitized = array();
		$count     = 0;

		foreach ( $data as $key => $value ) {
			if ( ++$count > self::MAX_FIELDS ) {
				break;
			}

			$key = sanitize_text_field( (string) $key );
			$key = substr( $key, 0, self::MAX_FIELD_KEY_LEN );
			if ( '' === $key ) {
				continue;
			}

			$sanitized[ $key ] = $this->sanitize_value( $value );
		}

		return $sanitized;
	}

	/**
	 * @param mixed $value
	 * @return mixed
	 */
	private function sanitize_value( $value ) {
		if ( is_array( $value ) ) {
			// File-field shape: list of associative arrays carrying an upload token.
			// Pass through as-is (only the token and a small allowlist of keys
			// survive) -- resolve_file_fields() re-derives everything else server-side.
			if ( $this->looks_like_file_field( $value ) ) {
				$files = array();
				foreach ( array_slice( $value, 0, self::MAX_ARRAY_ITEMS ) as $file ) {
					if ( isset( $file['token'] ) && is_string( $file['token'] ) ) {
						$files[] = array( 'token' => sanitize_text_field( $file['token'] ) );
					}
				}
				return $files;
			}

			$items = array();
			foreach ( array_slice( $value, 0, self::MAX_ARRAY_ITEMS ) as $item ) {
				if ( is_array( $item ) ) {
					continue; // Reject unexpected nesting beyond one level.
				}
				$items[] = $this->sanitize_scalar( $item );
			}
			return $items;
		}

		return $this->sanitize_scalar( $value );
	}

	/**
	 * @param mixed $value
	 * @return string|int|float|bool
	 */
	private function sanitize_scalar( $value ) {
		if ( is_bool( $value ) || is_int( $value ) || is_float( $value ) ) {
			return $value;
		}

		$value = (string) $value;
		$value = substr( $value, 0, self::MAX_STRING_LEN );

		return sanitize_textarea_field( $value );
	}

	/**
	 * @param array $value
	 * @return bool
	 */
	private function looks_like_file_field( array $value ): bool {
		if ( empty( $value ) || ! is_array( $value[0] ?? null ) ) {
			return false;
		}
		return isset( $value[0]['token'] );
	}

	/**
	 * Replaces every file-field token with the server-verified file data the
	 * upload endpoint recorded for it. Any client-supplied url/name/type/size/
	 * attachment_id/path is discarded -- only what UploadTokens has on file is
	 * ever used downstream (Database/Email providers).
	 *
	 * @param array $submission_data Sanitized submission_data.
	 * @return array
	 */
	private function resolve_file_fields( array $submission_data ): array {
		foreach ( $submission_data as $key => $value ) {
			if ( ! is_array( $value ) || ! $this->looks_like_file_field( $value ) ) {
				continue;
			}

			$resolved = array();
			foreach ( $value as $file_ref ) {
				$token     = $file_ref['token'] ?? '';
				$file_data = '' !== $token ? UploadTokens::consume( $token ) : null;

				if ( null === $file_data ) {
					continue; // Missing/expired/already-used token -- drop this file.
				}

				$resolved[] = array(
					'url'           => $file_data['url'] ?? '',
					'name'          => $file_data['name'] ?? '',
					'original_name' => $file_data['original_name'] ?? '',
					'type'          => $file_data['type'] ?? '',
					'size'          => isset( $file_data['size'] ) ? (int) $file_data['size'] : 0,
				);
			}

			$submission_data[ $key ] = $resolved;
		}

		return $submission_data;
	}
}
