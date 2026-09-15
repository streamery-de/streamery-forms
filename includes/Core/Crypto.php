<?php

/**
 * Crypto
 *
 * At-rest encryption for secrets the plugin stores in wp_options (SMTP
 * password, CAPTCHA secret keys, ...). The key is derived from wp_salt(),
 * which is unique per install and never leaves the server -- this is not a
 * replacement for a secrets manager, but it is meaningfully better than the
 * base64 "encoding" this replaces, which offered no protection at all and is
 * exactly the pattern WordPress.org review flags as obfuscation.
 *
 * @package StreameryForms\Core
 * @since 1.0.0
 */

namespace StreameryForms\Core;

defined('ABSPATH') || exit;

/**
 * Class Crypto
 */
class Crypto
{
	/**
	 * Prefix marking a value as produced by encrypt(), so decrypt() can tell
	 * an encrypted value apart from a legacy base64 or plaintext value stored
	 * by a previous plugin version.
	 */
	private const PREFIX = 'sfenc$';

	/**
	 * Encrypts a string for storage. Returns the plaintext unchanged (not
	 * base64, not obfuscated) if libsodium isn't available, since that is
	 * strictly more honest than fake-encrypting it.
	 *
	 * @param string $plaintext Value to encrypt.
	 * @return string
	 */
	public static function encrypt(string $plaintext): string
	{
		if ('' === $plaintext || ! self::is_available()) {
			return $plaintext;
		}

		$key   = self::get_key();
		$nonce = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
		$cipher = sodium_crypto_secretbox($plaintext, $nonce, $key);

		return self::PREFIX . base64_encode($nonce . $cipher);
	}

	/**
	 * Decrypts a value produced by encrypt(). Values that don't carry our
	 * prefix are returned unchanged -- this makes decrypt() safe to call on
	 * a value saved by a previous plugin version (plaintext, or the old
	 * base64 "encoding") without a separate migration step.
	 *
	 * @param string $stored Stored value.
	 * @return string
	 */
	public static function decrypt(string $stored): string
	{
		if (0 !== strpos($stored, self::PREFIX)) {
			return self::decode_legacy($stored);
		}

		if (! self::is_available()) {
			return '';
		}

		$decoded = base64_decode(substr($stored, strlen(self::PREFIX)), true);
		if (false === $decoded || strlen($decoded) < SODIUM_CRYPTO_SECRETBOX_NONCEBYTES) {
			return '';
		}

		$nonce  = substr($decoded, 0, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
		$cipher = substr($decoded, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
		$key    = self::get_key();

		$plaintext = sodium_crypto_secretbox_open($cipher, $nonce, $key);

		return false === $plaintext ? '' : $plaintext;
	}

	/**
	 * Best-effort read of a value stored by a pre-1.0 install, which used
	 * base64_encode() as a (non-)security measure. Falls back to treating the
	 * value as already-plaintext if it doesn't decode as base64.
	 *
	 * @param string $stored Stored value.
	 * @return string
	 */
	private static function decode_legacy(string $stored): string
	{
		if ('' === $stored) {
			return '';
		}

		$decoded = base64_decode($stored, true);

		return false !== $decoded ? $decoded : $stored;
	}

	/**
	 * @return bool
	 */
	private static function is_available(): bool
	{
		return function_exists('sodium_crypto_secretbox') && defined('SODIUM_CRYPTO_SECRETBOX_KEYBYTES');
	}

	/**
	 * Shows a dashboard notice on hosts without libsodium, where secrets
	 * (SMTP password, CAPTCHA keys) are stored in plaintext rather than
	 * pretending base64 offers any protection.
	 *
	 * @return void
	 */
	public static function maybe_show_unavailable_notice(): void
	{
		if (self::is_available() || ! current_user_can('manage_options')) {
			return;
		}

		add_action('admin_notices', function () {
			// Only on the plugin's own pages, where these secrets are entered.
			$screen = get_current_screen();
			if (! $screen || false === strpos($screen->id, 'streamery-forms')) {
				return;
			}

			printf(
				'<div class="notice notice-warning is-dismissible"><p>%s</p></div>',
				esc_html__('Streamery Forms: the libsodium PHP extension is not available on this server, so secrets you save (SMTP password, CAPTCHA keys) are stored in plain text rather than encrypted. Ask your host to enable the sodium extension.', 'streamery-forms')
			);
		});
	}

	/**
	 * Derives a stable 32-byte key from wp_salt(). wp_salt() is unique per
	 * install and stored outside the database (wp-config.php / environment),
	 * so this ties encrypted values to the install that created them.
	 *
	 * @return string
	 */
	private static function get_key(): string
	{
		return sodium_crypto_generichash(wp_salt('auth') . wp_salt('secure_auth'), '', SODIUM_CRYPTO_SECRETBOX_KEYBYTES);
	}
}
