<?php

/**
 * Class Actions
 *
 * Handles entry-related actions such as creation, retrieval, deletion, and update.
 *
 * @package StreameryForms\Controllers\Entries
 * @since 1.0.0
 */

namespace StreameryForms\Controllers\Entries;

use StreameryForms\Models\Entries;
use StreameryForms\Models\InboxFolder;

/**
 * Class Actions
 *
 * Handles entry-related actions.
 *
 * @package StreameryForms\Controllers\Entries
 */
class Actions
{

	/**
	 * Creates a new entry.
	 *
	 * @param \WP_REST_Request $request The REST request object.
	 * @return array|\WP_Error The response message or error.
	 */
	public function create(\WP_REST_Request $request)
	{
		try {
			$entry = new Entries();
			$entry->mailbox_id     = $request->get_param('mailbox_id');
			$entry->form_identifier = $request->get_param('form_identifier');
			$entry->wp_post_id     = $request->get_param('wp_post_id');
			$entry->data            = $request->get_param('data');
			$entry->ip_address     = $request->get_param('ip_address');
			$entry->is_read         = $request->get_param('is_read') ?? false;
			$entry->date_created    = current_time('mysql');

			$entry->save();

			// Load labels after save
			$entry->load('labels');

			return array(
				'success' => true,
				'message' => __('Entry created successfully.', 'streamery-forms'),
				'data'    => $entry,
			);
		} catch (\Exception $e) {
			return new \WP_Error(
				'entry_creation_failed',
				__('Failed to create entry: ', 'streamery-forms') . $e->getMessage(),
				array('status' => 500)
			);
		}
	}

	/**
	 * Retrieves all entries with optional filters.
	 *
	 * @param \WP_REST_Request $request The REST request object.
	 * @return array The list of entries.
	 */
	public function get(\WP_REST_Request $request)
	{
		try {
			$query = Entries::query();

			// Filter by mailbox_id.
			if ($request->get_param('mailbox_id')) {
				$mailbox_id = absint($request->get_param('mailbox_id'));
				if ($mailbox_id > 0) {
					$query->where('mailbox_id', $mailbox_id);
				}
			}

			// Filter by form_identifier.
			if ($request->get_param('form_identifier')) {
				$form_identifier = sanitize_text_field($request->get_param('form_identifier'));
				if (!empty($form_identifier)) {
					$query->where('form_identifier', $form_identifier);
				}
			}

			// Filter by is_read.
			if ($request->has_param('is_read')) {
				$is_read = $request->get_param('is_read');
				// Handle both string and boolean values
				if (is_string($is_read)) {
					$is_read = filter_var($is_read, FILTER_VALIDATE_BOOLEAN);
				}
				$query->where('is_read', $is_read ? 1 : 0);
			}

			// Filter by folder_id: when viewing a user folder, show only its entries; when viewing system folders (Inbox/Junk/Archive/Trash), show only entries not in any user folder.
			if ($request->has_param('folder_id')) {
				$folder_id = absint($request->get_param('folder_id'));
				if ($folder_id > 0) {
					$query->where('folder_id', $folder_id);
				} else {
					$query->whereNull('folder_id');
				}
			} else {
				// No folder_id in request: system folder view — only show entries that are not in any user folder.
				$query->whereNull('folder_id');
			}

			// Filter by status (ignored when folder_id is set).
			if (!$request->has_param('folder_id') || absint($request->get_param('folder_id')) <= 0) {
				if ($request->get_param('status')) {
					$status = sanitize_text_field($request->get_param('status'));
					if (!empty($status)) {
						$query->where('status', $status);
					}
				}
			}

			// Filter by labels (many-to-many relationship).
			if ($request->get_param('labels')) {
				$label_ids = explode(',', $request->get_param('labels'));
				$label_ids = array_map('trim', $label_ids);
				$label_ids = array_filter($label_ids, 'is_numeric');

				if (!empty($label_ids)) {
					$query->whereHas('labels', function ($q) use ($label_ids) {
						$q->whereIn('id', $label_ids);
					});
				}
			}

			// Filter by search (search in data JSON field and other text fields).
			if ($request->get_param('search')) {
				$search_term = sanitize_text_field($request->get_param('search'));
				$query->where(function ($q) use ($search_term) {
					// Search in form_identifier
					$q->where('form_identifier', 'LIKE', '%' . $search_term . '%')
						// Search in data JSON field (search JSON string representation)
						->orWhere('data', 'LIKE', '%' . $search_term . '%')
						// Search in ip_address
						->orWhere('ip_address', 'LIKE', '%' . $search_term . '%');
				});
			}

			// Pagination.
			$per_page = $request->get_param('per_page') ?? 10;
			$page     = $request->get_param('page') ?? 1;

			$total = $query->count();
			$entries = $query->offset(($page - 1) * $per_page)
				->limit($per_page)
				->orderBy('date_created', 'DESC')
				->with('labels')
				->get();

			return array(
				'success' => true,
				'data'    => $entries,
				'total'   => $total,
				'page'    => $page,
				'per_page' => $per_page,
			);
		} catch (\Exception $e) {
			return new \WP_Error(
				'entry_retrieval_failed',
				__('Failed to retrieve entries: ', 'streamery-forms') . $e->getMessage(),
				array('status' => 500)
			);
		}
	}

	/**
	 * Retrieves a single entry by ID.
	 *
	 * @param \WP_REST_Request $request The REST request object.
	 * @return array|\WP_Error The entry or error.
	 */
	public function get_single(\WP_REST_Request $request)
	{
		try {
			$id = $request->get_param('id');

			$entry = Entries::with('labels')->find($id);

			if (! $entry) {
				return new \WP_Error(
					'entry_not_found',
					__('Entry not found.', 'streamery-forms'),
					array('status' => 404)
				);
			}

			return array(
				'success' => true,
				'data'    => $entry,
			);
		} catch (\Exception $e) {
			return new \WP_Error(
				'entry_retrieval_failed',
				__('Failed to retrieve entry: ', 'streamery-forms') . $e->getMessage(),
				array('status' => 500)
			);
		}
	}

	/**
	 * Updates an entry.
	 *
	 * @param \WP_REST_Request $request The REST request object.
	 * @return array|\WP_Error The response message or error.
	 */
	public function update(\WP_REST_Request $request)
	{
		$id = $request->get_param('id');

		$entry = Entries::find($id);

		if (! $entry) {
			return new \WP_Error(
				'entry_not_found',
				__('Entry not found.', 'streamery-forms'),
				array('status' => 404)
			);
		}

		try {
			if ($request->has_param('mailbox_id')) {
				$entry->mailbox_id = $request->get_param('mailbox_id');
			}
			if ($request->has_param('form_identifier')) {
				$entry->form_identifier = $request->get_param('form_identifier');
			}
			if ($request->has_param('wp_post_id')) {
				$entry->wp_post_id = $request->get_param('wp_post_id');
			}
			if ($request->has_param('data')) {
				$entry->data = $request->get_param('data');
			}
			if ($request->has_param('ip_address')) {
				$entry->ip_address = $request->get_param('ip_address');
			}
			if ($request->has_param('is_read')) {
				$entry->is_read = $request->get_param('is_read');
			}

			if ($request->has_param('status')) {
				$entry->status = $request->get_param('status');
			}

			if ($request->has_param('labels')) {
				$entry->labels()->sync($request->get_param('labels'));
			}

			if ($request->has_param('folder_id')) {
				$folder_id = $request->get_param('folder_id');
				if ($folder_id === null || $folder_id === '') {
					$entry->folder_id = null;
				} else {
					$folder_id = absint($folder_id);
					if ($folder_id > 0) {
						$folder = InboxFolder::where('id', $folder_id)->where('mailbox_id', $entry->mailbox_id)->first();
						if (!$folder) {
							return new \WP_Error(
								'invalid_folder',
								__('Folder not found or does not belong to this mailbox.', 'streamery-forms'),
								array('status' => 400)
							);
						}
						$entry->folder_id = $folder_id;
					} else {
						$entry->folder_id = null;
					}
				}
			}

			$entry->save();

			// Load labels after save
			$entry->load('labels');

			return array(
				'success' => true,
				'message' => __('Entry updated successfully.', 'streamery-forms'),
				'data'    => $entry,
			);
		} catch (\Exception $e) {
			return new \WP_Error(
				'entry_update_failed',
				__('Failed to update entry: ', 'streamery-forms') . $e->getMessage(),
				array('status' => 500)
			);
		}
	}

	/**
	 * Deletes an entry.
	 *
	 * @param \WP_REST_Request $request The REST request object.
	 * @return array|\WP_Error The response message or error.
	 */
	public function delete(\WP_REST_Request $request)
	{
		$id = $request->get_param('id');

		$entry = Entries::find($id);

		if (! $entry) {
			return new \WP_Error(
				'entry_not_found',
				__('Entry not found.', 'streamery-forms'),
				array('status' => 404)
			);
		}

		try {
			// Move entry to trash instead of permanently deleting
			$entry->status = 'trash';
			$entry->save();

			return array(
				'success' => true,
				'message' => __('Entry moved to trash successfully.', 'streamery-forms'),
			);
		} catch (\Exception $e) {
			return new \WP_Error(
				'entry_deletion_failed',
				__('Failed to move entry to trash: ', 'streamery-forms') . $e->getMessage(),
				array('status' => 500)
			);
		}
	}

	/**
	 * Marks an entry as read or unread.
	 *
	 * @param \WP_REST_Request $request The REST request object.
	 * @return array|\WP_Error The response message or error.
	 */
	public function mark_read(\WP_REST_Request $request)
	{
		$id     = $request->get_param('id');
		$is_read = $request->get_param('is_read') ?? true;

		$entry = Entries::find($id);

		if (! $entry) {
			return new \WP_Error(
				'entry_not_found',
				__('Entry not found.', 'streamery-forms'),
				array('status' => 404)
			);
		}

		try {
			$entry->is_read = $is_read;
			$entry->save();

			// Load labels after save
			$entry->load('labels');

			return array(
				'success' => true,
				'message' => $is_read ? __('Entry marked as read.', 'streamery-forms') : __('Entry marked as unread.', 'streamery-forms'),
				'data'    => $entry,
			);
		} catch (\Exception $e) {
			return new \WP_Error(
				'entry_update_failed',
				__('Failed to update entry: ', 'streamery-forms') . $e->getMessage(),
				array('status' => 500)
			);
		}
	}

	/**
	 * Retrieves all unique form identifiers with their entry count.
	 *
	 * @param \WP_REST_Request $request The REST request object.
	 * @return array|\WP_Error The list of form identifiers with counts or error.
	 */
	public function get_form_identifiers(\WP_REST_Request $request)
	{
		try {
			$mailbox_id  = $request->get_param('mailbox_id');
			$unread_only = $request->get_param('unread_only');

			$query = Entries::selectRaw('form_identifier, COUNT(*) as count')
				->whereNotNull('form_identifier')
				->where('form_identifier', '!=', '');

			if (!empty($mailbox_id)) {
				$query = $query->where('mailbox_id', $mailbox_id);
			}

			if ($unread_only) {
				$query = $query->where('is_read', 0);
			}

			$query = $query
				->groupBy('form_identifier')
				->orderBy('count', 'DESC')
				->get();

			$formIdentifiers = $query->map(function ($item) {
				return array(
					'form_identifier' => $item->form_identifier,
					'count'           => (int) $item->count,
				);
			})->toArray();

			return array(
				'success' => true,
				'data'    => $formIdentifiers,
			);
		} catch (\Exception $e) {
			return new \WP_Error(
				'form_identifiers_retrieval_failed',
				__('Failed to retrieve form identifiers: ', 'streamery-forms') . $e->getMessage(),
				array('status' => 500)
			);
		}
	}

	/**
	 * Retrieves all unique statuses with their entry count.
	 *
	 * @param \WP_REST_Request $request The REST request object.
	 * @return array|\WP_Error The list of statuses with counts or error.
	 */
	public function get_statuses(\WP_REST_Request $request)
	{
		try {
			$mailbox_id   = $request->get_param('mailbox_id');
			$unread_only  = $request->get_param('unread_only');

			$query = Entries::selectRaw('status, COUNT(*) as count')
				->whereNotNull('status')
				->where('status', '!=', '')
				->whereNull('folder_id');

			if (!empty($mailbox_id)) {
				$query = $query->where('mailbox_id', $mailbox_id);
			}

			if ($unread_only) {
				$query = $query->where('is_read', 0);
			}

			$query = $query
				->groupBy('status')
				->orderBy('count', 'DESC')
				->get();

			$statuses = $query->map(function ($item) {
				return array(
					'status' => $item->status,
					'count'  => (int) $item->count,
				);
			})->toArray();

			return array(
				'success' => true,
				'data'    => $statuses,
			);
		} catch (\Exception $e) {
			return new \WP_Error(
				'statuses_retrieval_failed',
				__('Failed to retrieve statuses: ', 'streamery-forms') . $e->getMessage(),
				array('status' => 500)
			);
		}
	}

	/**
	 * Permanently deletes all entries in trash.
	 *
	 * @param \WP_REST_Request $request The REST request object.
	 * @return array|\WP_Error The response message or error.
	 */
	public function empty_trash(\WP_REST_Request $request)
	{
		// Verify nonce
		$nonce = $request->get_header('X-WP-Nonce');
		if (!$nonce || !wp_verify_nonce($nonce, 'wp_rest')) {
			return new \WP_Error(
				'rest_forbidden',
				__('Security check failed.', 'streamery-forms'),
				array('status' => 403)
			);
		}

		// Check user capabilities
		if (!current_user_can('manage_options')) {
			return new \WP_Error(
				'rest_forbidden',
				__('You do not have permission to empty trash.', 'streamery-forms'),
				array('status' => 403)
			);
		}

		try {
			$deleted_count = Entries::where('status', 'trash')->delete();

			return array(
				'success' => true,
				'message' => sprintf(
					/* translators: %d: number of permanently deleted entries. */
					_n(
						'%d entry permanently deleted.',
						'%d entries permanently deleted.',
						$deleted_count,
						'streamery-forms'
					),
					$deleted_count
				),
				'deleted_count' => $deleted_count,
			);
		} catch (\Exception $e) {
			return new \WP_Error(
				'trash_empty_failed',
				__('Failed to empty trash: ', 'streamery-forms') . $e->getMessage(),
				array('status' => 500)
			);
		}
	}
}
