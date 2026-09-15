<?php

/**
 * Abstract Provider Base Class
 *
 * Base class for all Streamery Forms providers. Defines the interface and common functionality.
 *
 * @package StreameryForms\Providers
 * @since 1.0.0
 */

namespace StreameryForms\Providers;

defined('ABSPATH') || exit;

/**
 * Abstract Provider Class
 *
 * All providers must extend this class and implement the abstract methods.
 */
abstract class AbstractProvider
{

    /**
     * Returns the unique slug of the provider.
     *
     * @return string
     */
    abstract public function get_slug(): string;

    /**
     * Returns the display name of the provider.
     *
     * @return string
     */
    abstract public function get_title(): string;

    /**
     * Processes a form submission.
     *
     * @param array  $submission_data The form data
     * @param array  $provider_settings The individual settings for this provider
     * @param string $form_identifier The form identifier
     * @return bool Success of processing
     */
    abstract public function process_submission(
        array $submission_data,
        array $provider_settings,
        string $form_identifier
    ): bool;

    /**
     * Returns the field definitions for the settings.
     * Used in the admin interface to generate dynamic forms.
     *
     * @return array Array of field definitions
     */
    abstract public function get_settings_fields(): array;

    /**
     * Whether this provider must run for every submission and cannot be
     * switched off per form. Required feeds are always placed first in the
     * execution order and their failure fails the submission (see
     * Controllers\Submissions\Handler).
     *
     * @return bool
     */
    public function is_required(): bool
    {
        return false;
    }

    /**
     * Returns the names of settings fields a single form may override, i.e.
     * those whose definition carries 'allow_form_override' => true.
     *
     * Anything not listed here is ignored when it shows up in a form's
     * providerOverrides, so a form can never rewrite a feed's endpoint,
     * credentials, or recipient.
     *
     * @return array<string>
     */
    public function get_form_overridable_settings(): array
    {
        $overridable = array();

        foreach ($this->get_settings_fields() as $field) {
            if (! empty($field['allow_form_override']) && ! empty($field['name'])) {
                $overridable[] = (string) $field['name'];
            }
        }

        return $overridable;
    }

    /**
     * Filters a form's requested settings overrides down to what this provider
     * actually allows a form to change, sanitizing each surviving value
     * against its declared field type.
     *
     * @param array $requested Raw per-form settings overrides.
     * @return array
     */
    public function filter_form_settings_overrides(array $requested): array
    {
        if (empty($requested)) {
            return array();
        }

        $definitions = array();
        foreach ($this->get_settings_fields() as $field) {
            if (! empty($field['name'])) {
                $definitions[(string) $field['name']] = $field;
            }
        }

        $allowed = array();

        foreach ($this->get_form_overridable_settings() as $name) {
            if (! array_key_exists($name, $requested)) {
                continue;
            }

            $definition = $definitions[$name] ?? array();
            $value      = $requested[$name];

            switch ($definition['type'] ?? 'text') {
                case 'select':
                    $options = array();
                    foreach ($definition['options'] ?? array() as $option) {
                        if (isset($option['value'])) {
                            $options[] = (string) $option['value'];
                        }
                    }
                    $value = (string) $value;
                    // Reject a value that isn't one of the offered options.
                    if (! empty($options) && ! in_array($value, $options, true)) {
                        continue 2;
                    }
                    $allowed[$name] = $value;
                    break;

                case 'number':
                    $allowed[$name] = (int) $value;
                    break;

                case 'checkbox':
                    $allowed[$name] = (bool) $value;
                    break;

                case 'textarea':
                    $allowed[$name] = wp_kses_post((string) $value);
                    break;

                default:
                    $allowed[$name] = sanitize_text_field((string) $value);
                    break;
            }
        }

        return $allowed;
    }

    /**
     * Returns the icon URL for the provider type.
     * Searches only in plugin assets folder. Priority: svg, png, jpg, jpeg.
     *
     * @return string|null The icon URL or null
     */
    public function get_icon(): ?string
    {
        return $this->resolve_provider_icon($this->get_slug());
    }

    /**
     * Resolves the icon URL for a provider slug.
     * Searches only in plugin folder assets/providers/. Extension priority: svg, png, jpg, jpeg.
     *
     * @param string $slug The provider slug (e.g. 'database', 'email').
     * @return string|null The icon URL or null if not found.
     */
    protected function resolve_provider_icon(string $slug): ?string
    {
        return self::get_icon_url_for_slug($slug);
    }

    /**
     * Returns the icon URL for a provider slug. Can be called statically.
     * Searches only in plugin folder assets/providers/. Extension priority: svg, png, jpg, jpeg.
     *
     * @param string $slug The provider slug (e.g. 'database', 'email', 'google-sheets').
     * @return string|null The icon URL or null if not found.
     */
    public static function get_icon_url_for_slug(string $slug): ?string
    {
        $extensions = array('svg', 'png', 'jpg', 'jpeg');

        if (defined('STREAMERY_FORMS_DIR') && defined('STREAMERY_FORMS_ASSETS_URL')) {
            $plugin_path = STREAMERY_FORMS_DIR . 'assets/providers/';
            foreach ($extensions as $ext) {
                $filename = $slug . '.' . $ext;
                if (file_exists($plugin_path . $filename)) {
                    return STREAMERY_FORMS_ASSETS_URL . '/providers/' . $filename;
                }
            }
        }

        return null;
    }

    /**
     * Replaces placeholders in a string.
     *
     * Supports:
     * - {field_slug} - Form field values
     * - {form_identifier} - Form identifier
     * - {form_title} - Form title (from Post Meta)
     * - {site_name} - Site name
     * - {date} - Current date
     * - {time} - Current time
     * - {ip_address} - Client IP address
     * - {all_fields} - All form fields as a list (key: value)
     *
     * @param string $content       The string with placeholders.
     * @param array  $submission_data The form data.
     * @param string $form_identifier The form identifier.
     * @param bool   $escape_values Whether field values should be HTML-escaped before
     *                              substitution. Pass true only when $content is going to be
     *                              rendered as HTML (an email body) -- leave false (default)
     *                              for plain-text contexts like a Subject header, an email
     *                              address, or a From name, where escaping would corrupt the
     *                              value instead of protecting anything (those all still go
     *                              through their own sanitize_email()/sanitize_text_field()
     *                              afterwards).
     * @return string String with replaced placeholders.
     */
    protected function replace_placeholders(
        string $content,
        array $submission_data,
        string $form_identifier,
        bool $escape_values = false
    ): string {
        $replacements = array();

        $prepare = function ($value) use ($escape_values) {
            if (is_array($value)) {
                $value = implode(', ', array_map(function ($item) {
                    return is_scalar($item) ? (string) $item : '';
                }, $value));
            } else {
                $value = (string) $value;
            }

            return $escape_values ? esc_html($value) : $value;
        };

        // Replace form field values
        foreach ($submission_data as $key => $value) {
            $replacements['{' . $key . '}'] = $prepare($value);
        }

        // Standard placeholders
        $replacements['{form_identifier}'] = $prepare($form_identifier);
        $replacements['{form_title}']     = $prepare($this->get_form_title($form_identifier));
        $replacements['{site_name}']      = $prepare(get_bloginfo('name'));
        $replacements['{date}']           = current_time('Y-m-d');
        $replacements['{time}']           = current_time('H:i:s');
        $replacements['{ip_address}']    = $this->get_client_ip();
        $replacements['{all_fields}']    = $this->format_all_fields($submission_data);

        // Primary mail placeholder (already validated by is_email()/sanitize_email(), never escaped)
        $replacements['{form_primary_mail}'] = $this->get_primary_mail($submission_data);

        // Replace all placeholders
        return str_replace(array_keys($replacements), array_values($replacements), $content);
    }

    /**
     * Gets the primary mail address from submission data.
     *
     * Looks for a field marked as primary mail, or falls back to the first email address found.
     *
     * @param array $submission_data The form submission data.
     * @return string The primary email address or empty string.
     */
    protected function get_primary_mail(array $submission_data): string
    {
        // Check if primary mail field is explicitly marked
        if (isset($submission_data['_primary_mail_field']) && !empty($submission_data['_primary_mail_field'])) {
            $primary_field_name = $submission_data['_primary_mail_field'];
            if (isset($submission_data[$primary_field_name])) {
                $primary_mail = $submission_data[$primary_field_name];
                if (is_email($primary_mail)) {
                    return sanitize_email($primary_mail);
                }
            }
        }

        // Fallback: Find first email-like value in submission data
        foreach ($submission_data as $key => $value) {
            // Skip metadata fields
            if (strpos($key, '_') === 0) {
                continue;
            }

            $email_value = is_array($value) ? (isset($value[0]) ? $value[0] : '') : $value;
            if (is_email($email_value)) {
                return sanitize_email($email_value);
            }
        }

        return '';
    }

    /**
     * Formats all form fields as a list in "key: value" format.
     *
     * @param array $submission_data The form data
     * @return string Formatted list of all fields
     */
    protected function format_all_fields(array $submission_data): string
    {
        if (empty($submission_data)) {
            return '';
        }

        $rows = '';
        foreach ($submission_data as $key => $value) {
            // Format value
            if (is_array($value)) {
                // Check if this is a file array (has 'url' key in first element)
                if (!empty($value) && is_array($value[0]) && isset($value[0]['url'])) {
                    // This is a file upload field. format_file_field() builds its own
                    // markup from esc_url()/esc_html()-wrapped pieces -- safe as-is.
                    $formatted_value = $this->format_file_field($value);
                } else {
                    $formatted_value = esc_html(implode(', ', array_map(function ($item) {
                        return is_scalar($item) ? (string) $item : '';
                    }, $value)));
                }
            } elseif (is_bool($value)) {
                $formatted_value = $value ? __('Yes', 'streamery-forms') : __('No', 'streamery-forms');
            } else {
                $formatted_value = esc_html((string) $value);
            }

            $rows .= '<tr style="border-bottom:1px solid #eee;"><td style="padding: 5px 10px; font-weight:bold; text-align:left;">' . esc_html($key) . '</td><td style="padding: 5px 10px;">' . $formatted_value . '</td></tr>';
        }

        $table = '<table style="border-collapse:collapse;width:100%;background:#fafbfc;border:1px solid #eaeaea;font-family:sans-serif;font-size:14px;margin:10px 0 15px 0;">';
        $table .= '<thead><tr style="background:#f0f4f8;"><th style="padding:8px 10px; text-align:left; border-bottom:2px solid #eaeaea;">' . __('Field', 'streamery-forms') . '</th><th style="padding:8px 10px;text-align:left; border-bottom:2px solid #eaeaea;">' . __('Value', 'streamery-forms') . '</th></tr></thead>';
        $table .= '<tbody>' . $rows . '</tbody>';
        $table .= '</table>';

        return $table;
    }

    /**
     * Gets the form title from the form identifier.
     *
     * @param string $form_identifier The form identifier
     * @return string The form title or the identifier as fallback
     */
    protected function get_form_title(string $form_identifier): string
    {
        // This used to just return the identifier, so every {form_title}
        // placeholder rendered the slug instead of the form's actual title.
        // The title is now indexed server-side, so it can be looked up.
        $form = \StreameryForms\Core\FormRegistry::get_instance()->get_form_config($form_identifier);
        $title = isset($form['config']['form_title']) ? trim((string) $form['config']['form_title']) : '';

        return '' !== $title ? $title : $form_identifier;
    }

    /**
     * Gets the client IP address.
     *
     * Trusts only REMOTE_ADDR by default -- every X-Forwarded-For-style header
     * is set by the client's own request and is trivially spoofable unless a
     * specific trusted reverse proxy strips/overwrites it, which this plugin
     * has no way to know. Sites that do run behind such a proxy can opt in to
     * a specific header via the streamery-forms/client_ip/trusted_header filter.
     *
     * @return string The IP address.
     */
    protected function get_client_ip(): string
    {
        $remote_addr = isset($_SERVER['REMOTE_ADDR'])
            ? sanitize_text_field(wp_unslash($_SERVER['REMOTE_ADDR']))
            : '';

        /**
         * Filters which $_SERVER header (if any) to trust for the client IP ahead of
         * REMOTE_ADDR. Only enable this if a trusted, misconfiguration-proof reverse
         * proxy sits in front of the site and is known to set/overwrite this header.
         *
         * @param string|null $header e.g. 'HTTP_X_FORWARDED_FOR'. Null (default) trusts only REMOTE_ADDR.
         */
        $trusted_header = apply_filters('streamery-forms/client_ip/trusted_header', null);

        if (! empty($trusted_header) && array_key_exists($trusted_header, $_SERVER)) {
            $forwarded = sanitize_text_field(wp_unslash((string) $_SERVER[$trusted_header]));
            foreach (explode(',', $forwarded) as $ip) {
                $ip = trim($ip);
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
                    return $ip;
                }
            }
        }

        return filter_var($remote_addr, FILTER_VALIDATE_IP) !== false ? $remote_addr : '';
    }

    /**
     * Formats file field data as HTML with thumbnails and download links.
     *
     * @param array $files Array of file data objects.
     * @return string HTML formatted file list.
     */
    protected function format_file_field(array $files): string
    {
        if (empty($files)) {
            return '';
        }

        $file_list = '<div style="display: flex; flex-direction: column; gap: 8px;">';

        foreach ($files as $file) {
            if (!isset($file['url']) || !isset($file['name'])) {
                continue;
            }

            $file_url = esc_url($file['url']);
            $file_name = esc_html($file['original_name'] ?? $file['name']);
            $file_type = $file['type'] ?? '';
            $is_image = strpos($file_type, 'image/') === 0;

            $file_list .= '<div style="display: flex; align-items: center; gap: 8px; padding: 8px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px;">';

            if ($is_image) {
                // Show thumbnail for images
                $file_list .= sprintf(
                    '<img src="%s" alt="%s" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; flex-shrink: 0;" />',
                    esc_url($file_url),
                    esc_attr($file_name)
                );
            } else {
                // Show file icon for non-images
                $file_list .= '<div style="width: 60px; height: 60px; background: #e5e7eb; border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">';
                $file_list .= '<span style="font-size: 24px;">📄</span>';
                $file_list .= '</div>';
            }

            $file_list .= '<div style="flex: 1; min-width: 0;">';
            $file_list .= sprintf(
                '<a href="%s" target="_blank" style="color: #3b82f6; text-decoration: none; font-weight: 500; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">%s</a>',
                $file_url,
                $file_name
            );

            if (isset($file['size'])) {
                $file_size = $this->format_file_size($file['size']);
                $file_list .= sprintf(
                    '<span style="font-size: 12px; color: #6b7280;">%s</span>',
                    esc_html($file_size)
                );
            }

            $file_list .= '</div>';
            $file_list .= '</div>';
        }

        $file_list .= '</div>';

        return $file_list;
    }

    /**
     * Formats file size in human-readable format.
     *
     * @param int $bytes File size in bytes.
     * @return string Formatted file size.
     */
    protected function format_file_size(int $bytes): string
    {
        $units = array('B', 'KB', 'MB', 'GB');
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);

        return round($bytes, 2) . ' ' . $units[$pow];
    }
}
