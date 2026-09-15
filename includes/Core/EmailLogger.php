<?php

/**
 * Email Logger
 *
 * Logs all emails sent via wp_mail().
 *
 * @package StreameryForms\Core
 * @since 1.0.0
 */

namespace StreameryForms\Core;

use StreameryForms\Models\EmailLogs;

defined('ABSPATH') || exit;

/**
 * Email Logger Class
 *
 * Handles logging of all emails sent through wp_mail().
 */
class EmailLogger
{
    use \StreameryForms\Traits\Base;

    /**
     * Current email data being logged
     *
     * @var array
     */
    private static $current_email_data = array();

    /**
     * Initialize email logging
     *
     * @return void
     */
    public function init()
    {
        // Hook into PHPMailer to capture email data
        add_action('phpmailer_init', array($this, 'capture_email_data'), 10, 1);

        // Hook into mail success/failure to log
        add_action('wp_mail_succeeded', array($this, 'log_successful_email'), 10, 1);
        add_action('wp_mail_failed', array($this, 'log_failed_email'), 10, 1);
    }

    /**
     * Capture email data from PHPMailer
     *
     * @param \PHPMailer\PHPMailer\PHPMailer $phpmailer The PHPMailer instance
     * @return void
     */
    public function capture_email_data($phpmailer)
    {
        // Check if email logging is enabled
        $smtp_settings = get_option('streamery_forms_smtp_settings', array());
        if (empty($smtp_settings['email_logging']) || !$smtp_settings['email_logging']) {
            return;
        }

        // Store email data for logging
        self::$current_email_data = array(
            'to' => $phpmailer->getToAddresses(),
            'subject' => $phpmailer->Subject,
            'message' => $phpmailer->Body,
            'headers' => $phpmailer->getCustomHeaders(),
            'attachments' => $phpmailer->getAttachments(),
            'from_email' => $phpmailer->From,
            'from_name' => $phpmailer->FromName,
        );
    }

    /**
     * Log successful email
     *
     * @param array $mail_data The mail data array
     * @return void
     */
    public function log_successful_email($mail_data)
    {
        $this->log_email('sent');
    }

    /**
     * Log failed email
     *
     * @param \WP_Error $error The error object
     * @return void
     */
    public function log_failed_email($error)
    {
        $this->log_email('failed', $error->get_error_message());
    }

    /**
     * Log email to database
     *
     * @param string $status The email status
     * @param string $error_message Optional error message
     * @return void
     */
    private function log_email($status, $error_message = '')
    {
        // Check if email logging is enabled
        $smtp_settings = get_option('streamery_forms_smtp_settings', array());
        if (empty($smtp_settings['email_logging']) || !$smtp_settings['email_logging']) {
            return;
        }

        // Check if we have email data
        if (empty(self::$current_email_data)) {
            return;
        }

        $data = self::$current_email_data;

        // Convert to email to string if array
        $to_email = '';
        if (is_array($data['to']) && !empty($data['to'])) {
            $to_emails = array();
            foreach ($data['to'] as $to) {
                if (is_array($to) && isset($to[0])) {
                    $to_emails[] = $to[0];
                } elseif (is_string($to)) {
                    $to_emails[] = $to;
                }
            }
            $to_email = implode(', ', $to_emails);
        } elseif (is_string($data['to'])) {
            $to_email = $data['to'];
        }

        // Convert attachments to array of file paths
        $attachments = array();
        if (is_array($data['attachments'])) {
            foreach ($data['attachments'] as $attachment) {
                if (is_array($attachment) && isset($attachment[0])) {
                    $attachments[] = $attachment[0];
                } elseif (is_string($attachment)) {
                    $attachments[] = $attachment;
                }
            }
        }

        // Prepare log entry
        $log_data = array(
            'to_email' => sanitize_email($to_email),
            'subject' => sanitize_text_field($data['subject'] ?? ''),
            'message' => wp_kses_post($data['message'] ?? ''),
            'headers' => is_array($data['headers']) ? $data['headers'] : array(),
            'attachments' => $attachments,
            'from_email' => sanitize_email($data['from_email'] ?? get_option('admin_email')),
            'from_name' => sanitize_text_field($data['from_name'] ?? get_bloginfo('name')),
            'status' => $status,
            'error_message' => !empty($error_message) ? sanitize_text_field($error_message) : null,
            'date_sent' => current_time('mysql'),
            'date_created' => current_time('mysql'),
        );

        // Create log entry
        try {
            EmailLogs::create($log_data);
        } catch (\Exception $e) {
            // Log error but don't break email sending
            Debug::log('Streamery Forms Email Logger Error: ' . $e->getMessage());
        }

        // Clear current email data
        self::$current_email_data = array();
    }
}
