<?php

/**
 * Upload Tokens
 *
 * Anonymous form submitters upload files before the form itself is submitted
 * (drag & drop, progress bars). Rather than trusting a path/URL/attachment_id
 * the client sends back at submit time -- which lets a submission attach any
 * file already on the site -- a successful upload is handed a short-lived,
 * single-use, per-file token. Only that token, resolved server-side, may be
 * referenced by a submission.
 *
 * @package StreameryForms\Core
 * @since 1.0.0
 */

namespace StreameryForms\Core;

defined('ABSPATH') || exit;

/**
 * Class UploadTokens
 */
class UploadTokens
{
	/**
	 * Transient key prefix.
	 */
	private const PREFIX = 'streamery_forms_upload_';

	/**
	 * How long an uploaded-but-not-yet-submitted file stays claimable.
	 */
	private const TTL = HOUR_IN_SECONDS;

	/**
	 * Issues a new token for a freshly uploaded file.
	 *
	 * @param array $file_data Associative array describing the stored file
	 *                         (at minimum: path, url, name, original_name, type, size).
	 * @return string The opaque token.
	 */
	public static function issue(array $file_data): string
	{
		$token = wp_generate_password(32, false, false);

		set_transient(self::PREFIX . $token, $file_data, self::TTL);

		return $token;
	}

	/**
	 * Resolves a token to its file data without consuming it. Used to build
	 * the response/preview data shown to the submitter before final submit.
	 *
	 * @param string $token Upload token.
	 * @return array|null
	 */
	public static function peek(string $token): ?array
	{
		$data = get_transient(self::PREFIX . $token);

		return is_array($data) ? $data : null;
	}

	/**
	 * Resolves a token to its file data and invalidates it so it can't be
	 * attached to a second submission.
	 *
	 * @param string $token Upload token.
	 * @return array|null
	 */
	public static function consume(string $token): ?array
	{
		$data = self::peek($token);

		if (null !== $data) {
			delete_transient(self::PREFIX . $token);
		}

		return $data;
	}
}
