<?php

/**
 * Class Actions
 *
 * Handles mailbox-related actions such as creation, retrieval, deletion, and update.
 *
 * @package StreameryForms\Controllers\Mailboxes
 * @since 1.0.0
 */

namespace StreameryForms\Controllers\Mailboxes;

use StreameryForms\Models\Mailboxes;

/**
 * Class Actions
 *
 * Handles mailbox-related actions.
 *
 * @package StreameryForms\Controllers\Mailboxes
 */
class Actions
{

    /**
     * Creates a new mailbox.
     *
     * @param \WP_REST_Request $request The REST request object.
     * @return array|\WP_Error The response message or error.
     */
    public function create(\WP_REST_Request $request)
    {
        try {
            // If this is set as default, unset other defaults.
            if ($request->get_param('is_default')) {
                Mailboxes::where('is_default', true)->update(array('is_default' => false));
            }

            $mailbox = new Mailboxes();
            $mailbox->title        = $request->get_param('title');
            $mailbox->is_default   = $request->get_param('is_default') ?? false;
            $mailbox->user_id       = $request->get_param('user_id');
            $mailbox->date_created  = current_time('mysql');

            $mailbox->save();

            return array(
                'success' => true,
                'message' => __('Mailbox created successfully.', 'streamery-forms'),
                'data'    => $mailbox,
            );
        } catch (\Exception $e) {
            return new \WP_Error(
                'mailbox_creation_failed',
                __('Failed to create mailbox: ', 'streamery-forms') . $e->getMessage(),
                array('status' => 500)
            );
        }
    }

    /**
     * Retrieves all mailboxes.
     *
     * @param \WP_REST_Request $request The REST request object.
     * @return array|\WP_Error The list of mailboxes or error.
     */
    public function get(\WP_REST_Request $request)
    {
        try {
            $query = Mailboxes::query();

            // Filter by user_id.
            if ($request->get_param('user_id')) {
                $query->where('user_id', $request->get_param('user_id'));
            }

            // Filter by is_default.
            if ($request->has_param('is_default')) {
                $query->where('is_default', $request->get_param('is_default') ? 1 : 0);
            }

            $mailboxes = $query->orderBy('date_created', 'DESC')->get();

            return array(
                'success' => true,
                'data'    => $mailboxes,
            );
        } catch (\Exception $e) {
            return new \WP_Error(
                'mailbox_retrieval_failed',
                __('Failed to retrieve mailboxes: ', 'streamery-forms') . $e->getMessage(),
                array('status' => 500)
            );
        }
    }

    /**
     * Retrieves a single mailbox by ID.
     *
     * @param \WP_REST_Request $request The REST request object.
     * @return array|\WP_Error The mailbox or error.
     */
    public function get_single(\WP_REST_Request $request)
    {
        try {
            $id = $request->get_param('id');

            $mailbox = Mailboxes::find($id);

            if (! $mailbox) {
                return new \WP_Error(
                    'mailbox_not_found',
                    __('Mailbox not found.', 'streamery-forms'),
                    array('status' => 404)
                );
            }

            return array(
                'success' => true,
                'data'    => $mailbox,
            );
        } catch (\Exception $e) {
            return new \WP_Error(
                'mailbox_retrieval_failed',
                __('Failed to retrieve mailbox: ', 'streamery-forms') . $e->getMessage(),
                array('status' => 500)
            );
        }
    }

    /**
     * Updates a mailbox.
     *
     * @param \WP_REST_Request $request The REST request object.
     * @return array|\WP_Error The response message or error.
     */
    public function update(\WP_REST_Request $request)
    {
        $id = $request->get_param('id');

        $mailbox = Mailboxes::find($id);

        if (! $mailbox) {
            return new \WP_Error(
                'mailbox_not_found',
                __('Mailbox not found.', 'streamery-forms'),
                array('status' => 404)
            );
        }

        try {
            // If setting as default, unset other defaults.
            if ($request->has_param('is_default') && $request->get_param('is_default')) {
                Mailboxes::where('is_default', true)
                    ->where('id', '!=', $id)
                    ->update(array('is_default' => false));
            }

            if ($request->has_param('title')) {
                $mailbox->title = $request->get_param('title');
            }
            if ($request->has_param('is_default')) {
                $mailbox->is_default = $request->get_param('is_default');
            }
            if ($request->has_param('user_id')) {
                $mailbox->user_id = $request->get_param('user_id');
            }

            $mailbox->save();

            return array(
                'success' => true,
                'message' => __('Mailbox updated successfully.', 'streamery-forms'),
                'data'    => $mailbox,
            );
        } catch (\Exception $e) {
            return new \WP_Error(
                'mailbox_update_failed',
                __('Failed to update mailbox: ', 'streamery-forms') . $e->getMessage(),
                array('status' => 500)
            );
        }
    }

    /**
     * Deletes a mailbox.
     *
     * @param \WP_REST_Request $request The REST request object.
     * @return array|\WP_Error The response message or error.
     */
    public function delete(\WP_REST_Request $request)
    {
        $id = $request->get_param('id');

        $mailbox = Mailboxes::find($id);

        if (! $mailbox) {
            return new \WP_Error(
                'mailbox_not_found',
                __('Mailbox not found.', 'streamery-forms'),
                array('status' => 404)
            );
        }

        try {
            $mailbox->delete();

            return array(
                'success' => true,
                'message' => __('Mailbox deleted successfully.', 'streamery-forms'),
            );
        } catch (\Exception $e) {
            return new \WP_Error(
                'mailbox_deletion_failed',
                __('Failed to delete mailbox: ', 'streamery-forms') . $e->getMessage(),
                array('status' => 500)
            );
        }
    }
}
