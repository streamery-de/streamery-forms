<?php

/**
 * Email Logs Controller
 *
 * This file is used to register all actions for the Email Logs Controller.
 *
 * @since 1.0.0
 */

namespace StreameryForms\Controllers\EmailLogs;

use StreameryForms\Models\EmailLogs;

defined('ABSPATH') || exit;

class Actions
{
    /**
     * Get email logs
     *
     * @param \WP_REST_Request $request
     * @return array
     */
    public function get_email_logs(\WP_REST_Request $request)
    {
        // Check user capabilities
        if (!current_user_can('manage_options')) {
            return new \WP_Error(
                'rest_forbidden',
                __('You do not have permission to view email logs.', 'streamery-forms'),
                array('status' => 403)
            );
        }

        $page = absint($request->get_param('page')) ?: 1;
        $per_page = absint($request->get_param('per_page')) ?: 20;
        $status = sanitize_text_field($request->get_param('status')) ?: '';

        $query = EmailLogs::query()->orderBy('date_sent', 'desc');

        // Filter by status if provided
        if (!empty($status)) {
            $query->where('status', $status);
        }

        // Get total count
        $total = $query->count();

        // Paginate
        $logs = $query->skip(($page - 1) * $per_page)
            ->take($per_page)
            ->get();

        return array(
            'success' => true,
            'data' => $logs,
            'total' => $total,
            'page' => $page,
            'per_page' => $per_page,
        );
    }

    /**
     * Get single email log
     *
     * @param \WP_REST_Request $request
     * @return array|\WP_Error
     */
    public function get_email_log(\WP_REST_Request $request)
    {
        // Check user capabilities
        if (!current_user_can('manage_options')) {
            return new \WP_Error(
                'rest_forbidden',
                __('You do not have permission to view email logs.', 'streamery-forms'),
                array('status' => 403)
            );
        }

        $id = absint($request->get_param('id'));
        $log = EmailLogs::find($id);

        if (!$log) {
            return new \WP_Error(
                'not_found',
                __('Email log not found.', 'streamery-forms'),
                array('status' => 404)
            );
        }

        return array(
            'success' => true,
            'data' => $log,
        );
    }

    /**
     * Delete email log
     *
     * @param \WP_REST_Request $request
     * @return array|\WP_Error
     */
    public function delete_email_log(\WP_REST_Request $request)
    {
        // Check user capabilities
        if (!current_user_can('manage_options')) {
            return new \WP_Error(
                'rest_forbidden',
                __('You do not have permission to delete email logs.', 'streamery-forms'),
                array('status' => 403)
            );
        }

        $id = absint($request->get_param('id'));
        $log = EmailLogs::find($id);

        if (!$log) {
            return new \WP_Error(
                'not_found',
                __('Email log not found.', 'streamery-forms'),
                array('status' => 404)
            );
        }

        $log->delete();

        return array(
            'success' => true,
            'message' => __('Email log deleted successfully.', 'streamery-forms'),
        );
    }

    /**
     * Delete all email logs
     *
     * @param \WP_REST_Request $request
     * @return array|\WP_Error
     */
    public function delete_all_email_logs(\WP_REST_Request $request)
    {
        // Check user capabilities
        if (!current_user_can('manage_options')) {
            return new \WP_Error(
                'rest_forbidden',
                __('You do not have permission to delete email logs.', 'streamery-forms'),
                array('status' => 403)
            );
        }

        EmailLogs::query()->delete();

        return array(
            'success' => true,
            'message' => __('All email logs deleted successfully.', 'streamery-forms'),
        );
    }
}
