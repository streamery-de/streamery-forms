<?php

/**
 * Class Actions
 *
 * Handles inbox folder-related actions: list, create, update, delete.
 *
 * @package StreameryForms\Controllers\InboxFolders
 * @since 1.0.0
 */

namespace StreameryForms\Controllers\InboxFolders;

use StreameryForms\Models\InboxFolder;
use StreameryForms\Models\Entries;

/**
 * Class Actions
 *
 * Handles inbox folder CRUD. Folders are per-mailbox; one tree under system folders.
 *
 * @package StreameryForms\Controllers\InboxFolders
 */
class Actions
{

	/**
	 * Retrieves all folders for a mailbox (flat list with parent_id; frontend builds tree).
	 *
	 * @param \WP_REST_Request $request The REST request object.
	 * @return array|\WP_Error The list of folders or error.
	 */
	public function get(\WP_REST_Request $request)
	{
		try {
			$mailbox_id = $request->get_param('mailbox_id');
			if (empty($mailbox_id)) {
				return new \WP_Error(
					'missing_mailbox_id',
					__('mailbox_id is required.', 'streamery-forms'),
					array('status' => 400)
				);
			}

			$mailbox_id = absint($mailbox_id);
			if ($mailbox_id <= 0) {
				return new \WP_Error(
					'invalid_mailbox_id',
					__('Invalid mailbox_id.', 'streamery-forms'),
					array('status' => 400)
				);
			}

			$folders = InboxFolder::where('mailbox_id', $mailbox_id)
				->withCount([ 'entries as entries_count' => function ( $q ) {
					$q->where('is_read', 0);
				} ])
				->orderBy('parent_id')
				->orderBy('sort_order')
				->orderBy('date_created')
				->get();

			return array(
				'success' => true,
				'data'    => $folders,
			);
		} catch (\Exception $e) {
			return new \WP_Error(
				'folders_retrieval_failed',
				__('Failed to retrieve folders: ', 'streamery-forms') . $e->getMessage(),
				array('status' => 500)
			);
		}
	}

	/**
	 * Creates a new folder.
	 *
	 * @param \WP_REST_Request $request The REST request object.
	 * @return array|\WP_Error The created folder or error.
	 */
	public function create(\WP_REST_Request $request)
	{
		try {
			$mailbox_id = absint($request->get_param('mailbox_id'));
			$name       = sanitize_text_field($request->get_param('name'));
			$parent_id  = $request->has_param('parent_id') ? absint($request->get_param('parent_id')) : null;
			$sort_order = $request->has_param('sort_order') ? absint($request->get_param('sort_order')) : 0;

			if ($mailbox_id <= 0 || empty($name)) {
				return new \WP_Error(
					'invalid_params',
					__('mailbox_id and name are required.', 'streamery-forms'),
					array('status' => 400)
				);
			}

			if ($parent_id !== null && $parent_id > 0) {
				$parent = InboxFolder::where('id', $parent_id)->where('mailbox_id', $mailbox_id)->first();
				if (!$parent) {
					return new \WP_Error(
						'parent_not_found',
						__('Parent folder not found or does not belong to this mailbox.', 'streamery-forms'),
						array('status' => 400)
					);
				}
			} else {
				$parent_id = null;
			}

			$folder = new InboxFolder();
			$folder->mailbox_id   = $mailbox_id;
			$folder->parent_id    = $parent_id;
			$folder->name         = $name;
			$folder->sort_order   = $sort_order;
			$folder->date_created = current_time('mysql');
			$folder->save();

			$folder->loadCount('entries');

			return array(
				'success' => true,
				'message' => __('Folder created successfully.', 'streamery-forms'),
				'data'    => $folder,
			);
		} catch (\Exception $e) {
			return new \WP_Error(
				'folder_creation_failed',
				__('Failed to create folder: ', 'streamery-forms') . $e->getMessage(),
				array('status' => 500)
			);
		}
	}

	/**
	 * Updates a folder (rename, move, sort_order).
	 *
	 * @param \WP_REST_Request $request The REST request object.
	 * @return array|\WP_Error The updated folder or error.
	 */
	public function update(\WP_REST_Request $request)
	{
		$id = $request->get_param('id');
		$folder = InboxFolder::find($id);

		if (!$folder) {
			return new \WP_Error(
				'folder_not_found',
				__('Folder not found.', 'streamery-forms'),
				array('status' => 404)
			);
		}

		try {
			if ($request->has_param('name')) {
				$folder->name = sanitize_text_field($request->get_param('name'));
			}
			if ($request->has_param('parent_id')) {
				$parent_id = $request->get_param('parent_id');
				if ($parent_id === null || $parent_id === '') {
					$folder->parent_id = null;
				} else {
					$parent_id = absint($parent_id);
					if ($parent_id > 0) {
						$parent = InboxFolder::where('id', $parent_id)->where('mailbox_id', $folder->mailbox_id)->first();
						if (!$parent || (int) $parent->id === (int) $folder->id) {
							return new \WP_Error(
								'invalid_parent',
								__('Invalid parent folder.', 'streamery-forms'),
								array('status' => 400)
							);
						}
						$folder->parent_id = $parent_id;
					} else {
						$folder->parent_id = null;
					}
				}
			}
			if ($request->has_param('sort_order')) {
				$folder->sort_order = absint($request->get_param('sort_order'));
			}

			$folder->save();
			$folder->loadCount('entries');

			return array(
				'success' => true,
				'message' => __('Folder updated successfully.', 'streamery-forms'),
				'data'    => $folder,
			);
		} catch (\Exception $e) {
			return new \WP_Error(
				'folder_update_failed',
				__('Failed to update folder: ', 'streamery-forms') . $e->getMessage(),
				array('status' => 500)
			);
		}
	}

	/**
	 * Deletes a folder: entries get folder_id = NULL; children get parent_id = folder's parent_id.
	 *
	 * @param \WP_REST_Request $request The REST request object.
	 * @return array|\WP_Error Success or error.
	 */
	public function delete(\WP_REST_Request $request)
	{
		$id = $request->get_param('id');
		$folder = InboxFolder::find($id);

		if (!$folder) {
			return new \WP_Error(
				'folder_not_found',
				__('Folder not found.', 'streamery-forms'),
				array('status' => 404)
			);
		}

		try {
			$parent_id = $folder->parent_id;

			Entries::where('folder_id', $folder->id)->update(array('folder_id' => null));

			InboxFolder::where('parent_id', $folder->id)->update(array('parent_id' => $parent_id));

			$folder->delete();

			return array(
				'success' => true,
				'message' => __('Folder deleted successfully.', 'streamery-forms'),
			);
		} catch (\Exception $e) {
			return new \WP_Error(
				'folder_deletion_failed',
				__('Failed to delete folder: ', 'streamery-forms') . $e->getMessage(),
				array('status' => 500)
			);
		}
	}
}
