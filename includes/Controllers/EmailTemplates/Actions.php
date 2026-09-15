<?php

/**
 * Email Templates Controller
 *
 * REST API controller for email template management.
 *
 * @package StreameryForms\Controllers\EmailTemplates
 * @since 1.0.0
 */

namespace StreameryForms\Controllers\EmailTemplates;

use StreameryForms\Core\EmailTemplates as EmailTemplatesCore;

defined('ABSPATH') || exit;

/**
 * Email Templates Actions Class
 *
 * Handles REST API requests for email templates.
 */
class Actions
{

    /**
     * Get all available email templates.
     *
     * @param \WP_REST_Request $request
     * @return array|\WP_Error
     */
    public function get_templates(\WP_REST_Request $request)
    {
        // Check user capabilities
        if (!current_user_can('manage_options')) {
            return new \WP_Error(
                'rest_forbidden',
                __('You do not have permission to view email templates.', 'streamery-forms'),
                array('status' => 403)
            );
        }

        $templates = EmailTemplatesCore::get_available_templates();

        return array(
            'success' => true,
            'data' => $templates,
        );
    }

    /**
     * Get a specific email template by name.
     *
     * @param \WP_REST_Request $request
     * @return array|\WP_Error
     */
    public function get_template(\WP_REST_Request $request)
    {
        // Check user capabilities
        if (!current_user_can('manage_options')) {
            return new \WP_Error(
                'rest_forbidden',
                __('You do not have permission to view email templates.', 'streamery-forms'),
                array('status' => 403)
            );
        }

        $template_name = $request->get_param('name');
        if (empty($template_name)) {
            return new \WP_Error(
                'missing_template_name',
                __('Template name is required.', 'streamery-forms'),
                array('status' => 400)
            );
        }

        $content = EmailTemplatesCore::get_template_content($template_name);
        if ($content === false) {
            return new \WP_Error(
                'template_not_found',
                __('Template not found.', 'streamery-forms'),
                array('status' => 404)
            );
        }

        $metadata = EmailTemplatesCore::parse_template_metadata($content);

        return array(
            'success' => true,
            'data' => array(
                'name' => $template_name,
                'title' => $metadata['title'] ?? $template_name,
                'description' => $metadata['description'] ?? '',
                'content' => $content,
            ),
        );
    }

    /**
     * Preview a template with customizations applied.
     *
     * @param \WP_REST_Request $request
     * @return array|\WP_Error
     */
    public function preview_template(\WP_REST_Request $request)
    {
        // Check user capabilities
        if (!current_user_can('manage_options')) {
            return new \WP_Error(
                'rest_forbidden',
                __('You do not have permission to preview email templates.', 'streamery-forms'),
                array('status' => 403)
            );
        }

        // Verify nonce
        $nonce = $request->get_header('X-WP-Nonce');
        if (!$nonce || !wp_verify_nonce($nonce, 'wp_rest')) {
            return new \WP_Error(
                'rest_forbidden',
                __('Security check failed.', 'streamery-forms'),
                array('status' => 403)
            );
        }

        $params = $request->get_json_params();
        $template_name = $params['template_name'] ?? '';
        $customizations = $params['customizations'] ?? array();

        if (empty($template_name)) {
            return new \WP_Error(
                'missing_template_name',
                __('Template name is required.', 'streamery-forms'),
                array('status' => 400)
            );
        }

        $template_content = EmailTemplatesCore::get_template_content($template_name);
        if ($template_content === false) {
            return new \WP_Error(
                'template_not_found',
                __('Template not found.', 'streamery-forms'),
                array('status' => 404)
            );
        }

        // Apply customizations
        // Templates now use {all_fields} directly, no need to replace body_content
        $customized_template = EmailTemplatesCore::apply_template_customizations(
            $template_content,
            $customizations
        );

        return array(
            'success' => true,
            'data' => array(
                'html' => $customized_template,
            ),
        );
    }
}
