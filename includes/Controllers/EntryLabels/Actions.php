<?php
/**
 * Class Actions
 *
 * Handles entry label-related actions such as creation, retrieval, deletion, and update.
 *
 * @package StreameryForms\Controllers\EntryLabels
 * @since 1.0.0
 */

namespace StreameryForms\Controllers\EntryLabels;

use StreameryForms\Models\EntryLabels;
use StreameryForms\Models\Entries;

/**
 * Class Actions
 *
 * Handles entry label-related actions.
 *
 * @package StreameryForms\Controllers\EntryLabels
 */
class Actions {

	/**
	 * Creates a new entry label.
	 *
	 * @param \WP_REST_Request $request The REST request object.
	 * @return array|\WP_Error The response message or error.
	 */
	public function create( \WP_REST_Request $request ) {
		try {
			// Check if name already exists (unique constraint).
			if ( EntryLabels::where( 'name', $request->get_param( 'name' ) )->exists() ) {
				return new \WP_Error(
					'label_name_exists',
					__( 'A label with this name already exists.', 'streamery-forms' ),
					array( 'status' => 400 )
				);
			}

			$label = new EntryLabels();
			$label->name         = $request->get_param( 'name' );
			$label->description  = $request->get_param( 'description' );
			$label->color        = $request->get_param( 'color' ) ?? '#000000';
			$label->date_created = current_time( 'mysql' );

			$label->save();

			return array(
				'success' => true,
				'message' => __( 'Label created successfully.', 'streamery-forms' ),
				'data'    => $label,
			);
		} catch ( \Exception $e ) {
			return new \WP_Error(
				'label_creation_failed',
				__( 'Failed to create label: ', 'streamery-forms' ) . $e->getMessage(),
				array( 'status' => 500 )
			);
		}
	}

	/**
	 * Retrieves all entry labels.
	 *
	 * @param \WP_REST_Request $request The REST request object.
	 * @return array|\WP_Error The list of labels or error.
	 */
	public function get( \WP_REST_Request $request ) {
		try {
			$labels = EntryLabels::orderBy( 'date_created', 'DESC' )->get();

			return array(
				'success' => true,
				'data'    => $labels,
			);
		} catch ( \Exception $e ) {
			return new \WP_Error(
				'label_retrieval_failed',
				__( 'Failed to retrieve labels: ', 'streamery-forms' ) . $e->getMessage(),
				array( 'status' => 500 )
			);
		}
	}

	/**
	 * Retrieves a single label by ID.
	 *
	 * @param \WP_REST_Request $request The REST request object.
	 * @return array|\WP_Error The label or error.
	 */
	public function get_single( \WP_REST_Request $request ) {
		try {
			$id = $request->get_param( 'id' );

			$label = EntryLabels::find( $id );

			if ( ! $label ) {
				return new \WP_Error(
					'label_not_found',
					__( 'Label not found.', 'streamery-forms' ),
					array( 'status' => 404 )
				);
			}

			return array(
				'success' => true,
				'data'    => $label,
			);
		} catch ( \Exception $e ) {
			return new \WP_Error(
				'label_retrieval_failed',
				__( 'Failed to retrieve label: ', 'streamery-forms' ) . $e->getMessage(),
				array( 'status' => 500 )
			);
		}
	}

	/**
	 * Updates an entry label.
	 *
	 * @param \WP_REST_Request $request The REST request object.
	 * @return array|\WP_Error The response message or error.
	 */
	public function update( \WP_REST_Request $request ) {
		$id = $request->get_param( 'id' );

		$label = EntryLabels::find( $id );

		if ( ! $label ) {
			return new \WP_Error(
				'label_not_found',
				__( 'Label not found.', 'streamery-forms' ),
				array( 'status' => 404 )
			);
		}

		try {
			// Check if name is being changed and if new name already exists.
			if ( $request->has_param( 'name' ) && $request->get_param( 'name' ) !== $label->name ) {
				if ( EntryLabels::where( 'name', $request->get_param( 'name' ) )->exists() ) {
					return new \WP_Error(
						'label_name_exists',
						__( 'A label with this name already exists.', 'streamery-forms' ),
						array( 'status' => 400 )
					);
				}
			}

			if ( $request->has_param( 'name' ) ) {
				$label->name = $request->get_param( 'name' );
			}
			if ( $request->has_param( 'description' ) ) {
				$label->description = $request->get_param( 'description' );
			}
			if ( $request->has_param( 'color' ) ) {
				$label->color = $request->get_param( 'color' );
			}

			$label->save();

			return array(
				'success' => true,
				'message' => __( 'Label updated successfully.', 'streamery-forms' ),
				'data'    => $label,
			);
		} catch ( \Exception $e ) {
			return new \WP_Error(
				'label_update_failed',
				__( 'Failed to update label: ', 'streamery-forms' ) . $e->getMessage(),
				array( 'status' => 500 )
			);
		}
	}

	/**
	 * Deletes an entry label.
	 *
	 * @param \WP_REST_Request $request The REST request object.
	 * @return array|\WP_Error The response message or error.
	 */
	public function delete( \WP_REST_Request $request ) {
		$id = $request->get_param( 'id' );

		$label = EntryLabels::find( $id );

		if ( ! $label ) {
			return new \WP_Error(
				'label_not_found',
				__( 'Label not found.', 'streamery-forms' ),
				array( 'status' => 404 )
			);
		}

		try {
			// Remove all relations before deleting.
			global $wpdb;
			$rel_table = $wpdb->prefix . 'streamery_forms_entry_label_rel';
			$wpdb->delete( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- relation table has no cache group.
				$rel_table,
				array( 'label_id' => $id ),
				array( '%d' )
			);

			$label->delete();

			return array(
				'success' => true,
				'message' => __( 'Label deleted successfully.', 'streamery-forms' ),
			);
		} catch ( \Exception $e ) {
			return new \WP_Error(
				'label_deletion_failed',
				__( 'Failed to delete label: ', 'streamery-forms' ) . $e->getMessage(),
				array( 'status' => 500 )
			);
		}
	}

	/**
	 * Attaches a label to an entry.
	 *
	 * @param \WP_REST_Request $request The REST request object.
	 * @return array|\WP_Error The response message or error.
	 */
	public function attach_to_entry( \WP_REST_Request $request ) {
		$entry_id = $request->get_param( 'entry_id' );
		$label_id = $request->get_param( 'label_id' );

		$entry = Entries::find( $entry_id );
		$label = EntryLabels::find( $label_id );

		if ( ! $entry ) {
			return new \WP_Error(
				'entry_not_found',
				__( 'Entry not found.', 'streamery-forms' ),
				array( 'status' => 404 )
			);
		}

		if ( ! $label ) {
			return new \WP_Error(
				'label_not_found',
				__( 'Label not found.', 'streamery-forms' ),
				array( 'status' => 404 )
			);
		}

		try {
			global $wpdb;
			$rel_table = $wpdb->prefix . 'streamery_forms_entry_label_rel';

			// Check if relation already exists. Table name is a plugin constant, not user input.
			$exists = $wpdb->get_var( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, PluginCheck.Security.DirectDB.UnescapedDBParameter
				$wpdb->prepare(
					"SELECT COUNT(*) FROM {$rel_table} WHERE entry_id = %d AND label_id = %d", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
					$entry_id,
					$label_id
				)
			);

			if ( $exists ) {
				return new \WP_Error(
					'label_already_attached',
					__( 'Label is already attached to this entry.', 'streamery-forms' ),
					array( 'status' => 400 )
				);
			}

			$wpdb->insert( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- relation table has no cache group.
				$rel_table,
				array(
					'entry_id'    => $entry_id,
					'label_id'    => $label_id,
					'date_applied' => current_time( 'mysql' ),
				),
				array( '%d', '%d', '%s' )
			);

			return array(
				'success' => true,
				'message' => __( 'Label attached to entry successfully.', 'streamery-forms' ),
			);
		} catch ( \Exception $e ) {
			return new \WP_Error(
				'label_attach_failed',
				__( 'Failed to attach label: ', 'streamery-forms' ) . $e->getMessage(),
				array( 'status' => 500 )
			);
		}
	}

	/**
	 * Detaches a label from an entry.
	 *
	 * @param \WP_REST_Request $request The REST request object.
	 * @return array|\WP_Error The response message or error.
	 */
	public function detach_from_entry( \WP_REST_Request $request ) {
		$entry_id = $request->get_param( 'entry_id' );
		$label_id = $request->get_param( 'label_id' );

		try {
			global $wpdb;
			$rel_table = $wpdb->prefix . 'streamery_forms_entry_label_rel';

			$deleted = $wpdb->delete( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- relation table has no cache group.
				$rel_table,
				array(
					'entry_id' => $entry_id,
					'label_id' => $label_id,
				),
				array( '%d', '%d' )
			);

			if ( ! $deleted ) {
				return new \WP_Error(
					'label_not_attached',
					__( 'Label is not attached to this entry.', 'streamery-forms' ),
					array( 'status' => 404 )
				);
			}

			return array(
				'success' => true,
				'message' => __( 'Label detached from entry successfully.', 'streamery-forms' ),
			);
		} catch ( \Exception $e ) {
			return new \WP_Error(
				'label_detach_failed',
				__( 'Failed to detach label: ', 'streamery-forms' ) . $e->getMessage(),
				array( 'status' => 500 )
			);
		}
	}
}

