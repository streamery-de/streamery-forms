<?php

/**
 * Email Provider
 *
 * Sends form submissions via email using WordPress wp_mail().
 *
 * @package StreameryForms\Providers
 * @since 1.0.0
 */

namespace StreameryForms\Providers;

use StreameryForms\Core\EmailTemplates;
use StreameryForms\Core\Debug;

defined('ABSPATH') || exit;

/**
 * Email Provider Class
 *
 * Handles email notifications for form submissions.
 */
class Email extends AbstractProvider
{

    /**
     * Returns the unique slug of the provider.
     *
     * @return string
     */
    public function get_slug(): string
    {
        return 'email';
    }

    /**
     * Returns the display name of the provider.
     *
     * @return string
     */
    public function get_title(): string
    {
        return __('Email Notification', 'streamery-forms');
    }

    /**
     * Processes a form submission.
     *
     * @param array  $submission_data The form data
     * @param array  $provider_settings The individual settings for this provider
     * @param string $form_identifier The form identifier
     * @return bool Success of processing
     */
    public function process_submission(
        array $submission_data,
        array $provider_settings,
        string $form_identifier
    ): bool {
        // 1. Replace placeholders in to_email BEFORE validation (plain text -- never escaped)
        $to_email_raw = $provider_settings['to_email'] ?? '';
        $to_email_replaced = $this->replace_placeholders(
            $to_email_raw,
            $submission_data,
            $form_identifier
        );
        $to_email = sanitize_email($to_email_replaced);

        // Subject is a plain-text mail header, not HTML -- never escaped.
        $subject = $this->replace_placeholders(
            $provider_settings['subject'] ?? '',
            $submission_data,
            $form_identifier
        );

        // Form-level override: use_provider_layout = false means use override content as full body
        $form_use_provider_layout = isset($provider_settings['_form_use_provider_layout']) ? (bool) $provider_settings['_form_use_provider_layout'] : true;
        $form_content_raw         = isset($provider_settings['_form_content']) ? $provider_settings['_form_content'] : '';

        // Everything below builds the text/html email body, so submission values
        // are HTML-escaped (escape_values: true) before substitution.
        if ($form_content_raw !== '' && ! $form_use_provider_layout) {
            // Full body from form override (replace placeholders in content)
            $body = $this->replace_placeholders($form_content_raw, $submission_data, $form_identifier, true);
        } else {
            // Build body from template or regular body
            $template_name = $provider_settings['email_template'] ?? '';

            if (!empty($template_name) && $template_name !== 'custom') {
                // Load template content
                $template_content = EmailTemplates::get_template_content($template_name);
                if ($template_content !== false) {
                    // Resolve {content}: form override (after placeholder replace) or default {all_fields}
                    $injected_content = $this->format_all_fields($submission_data);
                    if ($form_content_raw !== '') {
                        $injected_content = $this->replace_placeholders($form_content_raw, $submission_data, $form_identifier, true);
                    }
                    $template_content = str_replace('{content}', $injected_content, $template_content);
                    // Also support legacy {all_fields} in templates
                    $template_content = str_replace('{all_fields}', $this->format_all_fields($submission_data), $template_content);
                    $body = $this->replace_placeholders($template_content, $submission_data, $form_identifier, true);
                } else {
                    // Template not found, fall back to regular body
                    Debug::log(sprintf(
                            'Streamery Forms Email Provider: Template "%s" not found, using regular body.',
                            $template_name
                        ));
                    $body = $this->replace_placeholders(
                        $provider_settings['body'] ?? '',
                        $submission_data,
                        $form_identifier,
                        true
                    );
                }
            } else {
                // No template or custom: use body; if it contains {content}, replace with form content or all_fields
                $body_raw = $provider_settings['body'] ?? '';
                $injected_content = $this->format_all_fields($submission_data);
                if ($form_content_raw !== '') {
                    $injected_content = $this->replace_placeholders($form_content_raw, $submission_data, $form_identifier, true);
                }
                $body_raw = str_replace('{content}', $injected_content, $body_raw);
                $body_raw = str_replace('{all_fields}', $this->format_all_fields($submission_data), $body_raw);
                $body = $this->replace_placeholders($body_raw, $submission_data, $form_identifier, true);
            }
        }

        // Replace placeholders in from_email BEFORE validation (plain text -- never escaped)
        $from_email_raw = $this->replace_placeholders(
            $provider_settings['from_email'] ?? get_option('admin_email'),
            $submission_data,
            $form_identifier
        );
        $from_email = sanitize_email($from_email_raw);

        // From name is a plain-text mail header, not HTML -- never escaped.
        $from_name = sanitize_text_field(
            $this->replace_placeholders(
                $provider_settings['from_name'] ?? get_bloginfo('name'),
                $submission_data,
                $form_identifier
            )
        );

        Debug::log(sprintf(
                'Streamery Forms Email Provider: Starting email processing for form "%s"',
                $form_identifier
            ));
        Debug::log(sprintf(
                'Streamery Forms Email Provider: To: %s, From: %s <%s>, Subject: %s',
                $to_email,
                $from_name,
                $from_email,
                $subject
            ));

        // Validation
        if (empty($to_email) || ! is_email($to_email)) {
            $is_placeholder = (strpos($to_email_raw, '{') !== false && strpos($to_email_raw, '}') !== false);
            if ($is_placeholder && empty($to_email_replaced)) {
                    Debug::log(sprintf(
                        'Streamery Forms Email Provider Error: Placeholder "%s" could not be resolved. No primary mail found in form submission. Make sure an email field is marked as primary mail or contains a valid email address.',
                        $to_email_raw
                    ));
                } else {
                    Debug::log(sprintf(
                        'Streamery Forms Email Provider Error: Invalid to_email address. Original: "%s", Replaced: "%s", Sanitized: "%s"',
                        $to_email_raw,
                        $to_email_replaced,
                        $to_email
                    ));
                }
            return false;
        }

        // Validate from_email after placeholder replacement
        if (empty($from_email) || ! is_email($from_email)) {
            Debug::log(sprintf(
                    'Streamery Forms Email Provider Error: Invalid from_email address after placeholder replacement. Original: "%s", Replaced: "%s"',
                    $provider_settings['from_email'] ?? '',
                    $from_email_raw
                ));
            return false;
        }

        // 2. Create headers
        $headers = array(
            'From: ' . $from_name . ' <' . $from_email . '>',
            'Content-Type: text/html; charset=UTF-8',
        );

        // 3. Collect file attachments (resolved only from server-verified upload data --
        // see Controllers\Submissions\Actions, which strips any client-supplied
        // attachment_id/path/url before a provider ever sees submission_data).
        $attachments = $this->get_file_attachments($submission_data);

        // 4. Send email
        if (! empty($attachments)) {
            Debug::log(sprintf(
                'Streamery Forms Email Provider: Attaching %d file(s) to email',
                count($attachments)
            ));
        }
        $result = wp_mail($to_email, $subject, $body, $headers, $attachments);

        if ($result) {
                Debug::log(sprintf('Streamery Forms Email Provider: Email sent successfully to %s', $to_email));
            } else {
                Debug::log(sprintf('Streamery Forms Email Provider Error: wp_mail() failed for %s. Check WordPress mail configuration.', $to_email));
            }

        return $result;
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
                'name'        => 'to_email',
                'label'       => __('Email Address', 'streamery-forms'),
                'type'        => 'email',
                'required'    => true,
                'default'     => '',
                'description' => __('Email address to which the notification will be sent.', 'streamery-forms'),
                'placeholder' => 'admin@example.com',
            ),
            array(
                'name'        => 'subject',
                'label'       => __('Subject', 'streamery-forms'),
                'type'        => 'text',
                'required'    => true,
                'default'     => __('New Form Submission: {form_title}', 'streamery-forms'),
                'description' => __('Email subject. Placeholders like {form_title} will be replaced.', 'streamery-forms'),
            ),
            array(
                'name'        => 'body',
                'label'       => __('Message', 'streamery-forms'),
                'type'        => 'textarea',
                'required'    => true,
                'default'     => '{all_fields}',
                'description' => __('Email message. HTML allowed. Placeholders like {field_name} will be replaced. Use {content} to inject form-specific content when the form has "Use provider layout" enabled.', 'streamery-forms'),
                'rows'        => 6,
            ),
            array(
                'name'        => 'from_email',
                'label'       => __('From Email', 'streamery-forms'),
                'type'        => 'text',
                'required'    => false,
                'default'     => get_option('admin_email'),
                'description' => __('Email address of the sender. Placeholders like {field_email} can be used.', 'streamery-forms'),
            ),
            array(
                'name'        => 'from_name',
                'label'       => __('From Name', 'streamery-forms'),
                'type'        => 'text',
                'required'    => false,
                'default'     => get_bloginfo('name'),
                'description' => __('Name of the sender.', 'streamery-forms'),
            ),
            // Email Template Settings (internal use only)
            array(
                'name'        => 'email_template',
                'label'       => __('Template', 'streamery-forms'),
                'type'        => 'text',
                'required'    => false,
                'default'     => '',
                'description' => __('Template name (internal use).', 'streamery-forms'),
            ),
        );
    }

    /**
     * Extracts file attachments from submission data.
     *
     * Deliberately does not trust attachment_id or an arbitrary path/url from
     * the submission payload -- Controllers\Submissions\Actions has already
     * resolved every file field from its upload token, so the 'url' present
     * here can only be one this site generated for a file it actually wrote
     * to wp-content/uploads/streamery-forms/. This never fetches a remote URL.
     *
     * @param array $submission_data The form submission data.
     * @return array Array of local file paths for wp_mail() attachments.
     */
    private function get_file_attachments(array $submission_data): array
    {
        $attachments = array();
        $upload_dir  = wp_upload_dir();

        foreach ($submission_data as $field_value) {
            if (! is_array($field_value) || empty($field_value) || ! is_array($field_value[0]) || ! isset($field_value[0]['url'])) {
                continue;
            }

            foreach ($field_value as $file_data) {
                if (! isset($file_data['url']) || ! is_string($file_data['url'])) {
                    continue;
                }

                if (strpos($file_data['url'], $upload_dir['baseurl']) !== 0) {
                    continue;
                }

                $file_path = str_replace($upload_dir['baseurl'], $upload_dir['basedir'], $file_data['url']);
                $real_path = realpath($file_path);
                $real_base = realpath($upload_dir['basedir']);

                // Containment check: the resolved path must stay inside the uploads dir.
                if ($real_path && $real_base && 0 === strpos($real_path, $real_base) && is_file($real_path)) {
                    $attachments[] = $real_path;
                }
            }
        }

        return $attachments;
    }
}
