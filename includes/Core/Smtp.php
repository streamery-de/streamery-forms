<?php
/**
 * SMTP Configuration
 *
 * Configures PHPMailer to use SMTP settings from the plugin.
 *
 * @package StreameryForms\Core
 * @since 1.0.0
 */

namespace StreameryForms\Core;

use StreameryForms\Traits\Base;
use StreameryForms\Core\Crypto;

defined('ABSPATH') || exit;

/**
 * SMTP Configuration Class
 *
 * Handles SMTP configuration for wp_mail() via PHPMailer.
 */
class Smtp
{
	use Base;
	/**
	 * Initialize SMTP configuration
	 *
	 * @return void
	 */
	public function init()
	{
		// Hook into PHPMailer initialization
		add_action('phpmailer_init', array($this, 'configure_phpmailer'));
	}

	/**
	 * Configure PHPMailer with SMTP settings
	 *
	 * @param \PHPMailer\PHPMailer\PHPMailer $phpmailer The PHPMailer instance
	 * @return void
	 */
	public function configure_phpmailer($phpmailer)
	{
		$settings = get_option('streamery_forms_smtp_settings', array());

		// Only configure if SMTP is enabled
		if (empty($settings['enabled']) || !$settings['enabled']) {
			return;
		}

		// Validate required settings
		if (empty($settings['host'])) {
			return;
		}

		// Configure PHPMailer for SMTP
		$phpmailer->isSMTP();
		$phpmailer->Host = sanitize_text_field($settings['host']);
		$phpmailer->Port = absint($settings['port'] ?? 587);
		
		// Set encryption (empty string for 'none')
		$encryption = sanitize_text_field($settings['encryption'] ?? 'tls');
		$phpmailer->SMTPSecure = ($encryption === 'none') ? '' : $encryption;

		// Set authentication if enabled
		if (!empty($settings['auth']) && $settings['auth']) {
			$phpmailer->SMTPAuth = true;
			$phpmailer->Username = sanitize_text_field($settings['username'] ?? '');

			$password = $settings['password'] ?? '';
			if (!empty($password)) {
				$phpmailer->Password = Crypto::decrypt($password);
			}
		} else {
			$phpmailer->SMTPAuth = false;
		}

		// Set from email and name if configured
		if (!empty($settings['from_email']) && is_email($settings['from_email'])) {
			$from_email = sanitize_email($settings['from_email']);
			$from_name = sanitize_text_field($settings['from_name'] ?? get_bloginfo('name'));
			
			// DO NOT clear recipients - wp_mail() sets them after phpmailer_init
			// Only clear Reply-To and custom headers, but keep recipients
			$phpmailer->clearReplyTos();
			$phpmailer->clearCustomHeaders();
			
			// Set the From address
			$phpmailer->setFrom($from_email, $from_name, false);
			
			// Also set Reply-To to match From
			$phpmailer->addReplyTo($from_email, $from_name);
		}

		// Enable debug output if WP_DEBUG is enabled
		if (defined('WP_DEBUG') && WP_DEBUG) {
			$phpmailer->SMTPDebug = 0; // 0 = off, 1 = client, 2 = client and server
		}
	}
}

