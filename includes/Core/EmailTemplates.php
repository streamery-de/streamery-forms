<?php

/**
 * Email Templates Class
 *
 * Handles loading and processing of email templates.
 *
 * @package StreameryForms\Core
 * @since 1.0.0
 */

namespace StreameryForms\Core;

defined('ABSPATH') || exit;

/**
 * Email Templates Class
 *
 * Manages email template loading, parsing, and customization.
 */
class EmailTemplates
{

    /**
     * Mail-safe font families.
     */
    const MAIL_SAFE_FONTS = array(
        'Arial, sans-serif',
        'Helvetica, sans-serif',
        'Georgia, serif',
        'Times New Roman, serif',
        'Verdana, sans-serif',
        'Courier New, monospace',
    );

    /**
     * Get all available templates from all configured directories.
     *
     * @return array Array of template metadata with keys: name, title, description, path
     */
    public static function get_available_templates(): array
    {
        $templates = array();
        $directories = self::get_template_directories();

        foreach ($directories as $directory) {
            if (!is_dir($directory)) {
                continue;
            }

            $files = glob($directory . '/*.html');
            if (!$files) {
                continue;
            }

            foreach ($files as $file) {
                $template_name = basename($file, '.html');
                $content = file_get_contents($file);
                $metadata = self::parse_template_metadata($content);

                // Only add if not already exists (theme templates override plugin templates)
                if (!isset($templates[$template_name])) {
                    $templates[$template_name] = array(
                        'name' => $template_name,
                        'title' => $metadata['title'] ?? $template_name,
                        'description' => $metadata['description'] ?? '',
                        'path' => $file,
                    );
                }
            }
        }

        return array_values($templates);
    }

    /**
     * Get template content by name.
     *
     * @param string $template_name Template name (without .html extension).
     * @return string|false Template content or false if not found.
     */
    public static function get_template_content(string $template_name)
    {
        // $template_name reaches this method from a REST parameter and from
        // provider settings, and used to be concatenated straight into a path.
        // Resolve it against the list of templates that actually exist instead,
        // so no traversal sequence can escape the template directories.
        foreach (self::get_available_templates() as $template) {
            if ($template['name'] !== $template_name) {
                continue;
            }

            $real_path = realpath($template['path']);
            if (false === $real_path) {
                return false;
            }

            // Belt and braces: the resolved file must still sit inside one of
            // the configured template directories.
            foreach (self::get_template_directories() as $directory) {
                $real_directory = realpath($directory);
                if ($real_directory && 0 === strpos($real_path, $real_directory)) {
                    return file_get_contents($real_path);
                }
            }

            return false;
        }

        return false;
    }

    /**
     * Parse template metadata from HTML comments.
     *
     * @param string $content Template content.
     * @return array Array with 'title' and 'description' keys.
     */
    public static function parse_template_metadata(string $content): array
    {
        $metadata = array(
            'title' => '',
            'description' => '',
        );

        // Extract comment block
        if (preg_match('/<!--\s*(.*?)\s*-->/s', $content, $matches)) {
            $comment_content = $matches[1];

            // Extract Title
            if (preg_match('/Title:\s*(.+)/i', $comment_content, $title_match)) {
                $metadata['title'] = trim($title_match[1]);
            }

            // Extract Description
            if (preg_match('/Description:\s*(.+)/is', $comment_content, $desc_match)) {
                $metadata['description'] = trim($desc_match[1]);
            }
        }

        return $metadata;
    }

    /**
     * Apply customizations to a template.
     *
     * @param string $template Template content.
     * @param array  $customizations Customization values with keys: primary_color, secondary_color, font_family, logo_url.
     * @return string Customized template content.
     */
    public static function apply_template_customizations(string $template, array $customizations): string
    {
        $defaults = array(
            'primary_color' => '#3b82f6',
            'secondary_color' => '#8b5cf6',
            'font_family' => 'Arial, sans-serif',
            'logo_url' => '',
        );

        $customizations = wp_parse_args($customizations, $defaults);

        // Sanitize colors
        $primary_color = sanitize_hex_color($customizations['primary_color']) ?: $defaults['primary_color'];
        $secondary_color = sanitize_hex_color($customizations['secondary_color']) ?: $defaults['secondary_color'];

        // Validate font family (must be mail-safe)
        $font_family = in_array($customizations['font_family'], self::MAIL_SAFE_FONTS, true)
            ? $customizations['font_family']
            : $defaults['font_family'];

        // Sanitize logo URL
        $logo_url = '';
        if (!empty($customizations['logo_url'])) {
            $logo_url = esc_url($customizations['logo_url']);
            // Wrap in img tag if it's a URL
            if ($logo_url) {
                $logo_url = '<img src="' . $logo_url . '" alt="' . esc_attr(get_bloginfo('name')) . '" style="max-width: 200px; height: auto;" />';
            }
        }

        // Replace placeholders
        $template = str_replace('{primary_color}', $primary_color, $template);
        $template = str_replace('{secondary_color}', $secondary_color, $template);
        $template = str_replace('{font_family}', $font_family, $template);
        $template = str_replace('{logo_url}', $logo_url, $template);

        return $template;
    }

    /**
     * Get all template directories (plugin + theme via filter).
     *
     * @return array Array of directory paths.
     */
    private static function get_template_directories(): array
    {
        $plugin_dir = plugin_dir_path(dirname(__DIR__)) . 'src/email-templates';

        $directories = array($plugin_dir);

        /**
         * Filter email template directories.
         *
         * Allows themes and other plugins to add their own template directories.
         * Theme directories will take precedence over plugin directories.
         *
         * @param array $directories Array of directory paths.
         * @return array Modified array of directory paths.
         */
        $directories = apply_filters('streamery-forms/email_template_directories', $directories);

        // Ensure all directories exist and are readable
        $valid_directories = array();
        foreach ($directories as $directory) {
            if (is_dir($directory) && is_readable($directory)) {
                $valid_directories[] = $directory;
            }
        }

        return $valid_directories;
    }
}

