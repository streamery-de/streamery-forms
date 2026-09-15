<?php

namespace StreameryForms\Controllers\Database;

use StreameryForms\Core\Debug;
use StreameryForms\Database\Seeders\Demo;
use StreameryForms\Database\Migrations\Mailboxes;
use StreameryForms\Database\Migrations\Entries;
use StreameryForms\Database\Migrations\EntryLabels;
use StreameryForms\Database\Migrations\Providers;

/**
 * Class Actions
 *
 * Handles database-related actions such as seeding demo data and removing tables.
 *
 * @package StreameryForms\Controllers\Database
 */
class Actions
{

	/**
	 * Seeds the database with demo data.
	 *
	 * @param \WP_REST_Request $request The REST request object.
	 * @return array The response message.
	 */
	public function seed_demo(\WP_REST_Request $request)
	{
		// Check if demo data already exists.
		if (Demo::has_data()) {
			return array(
				'success' => false,
				'message' => __('Demo data already exists in the database.', 'streamery-forms'),
			);
		}

		try {
			Demo::run();
			return array(
				'success' => true,
				'message' => __('Demo data has been successfully seeded.', 'streamery-forms'),
			);
		} catch (\Exception $e) {
			return array(
				'success' => false,
				'message' => __('Error seeding demo data: ', 'streamery-forms') . $e->getMessage(),
			);
		}
	}

	/**
	 * Checks if demo data exists.
	 *
	 * @param \WP_REST_Request $request The REST request object.
	 * @return array The response with has_data flag.
	 */
	public function check_demo_data(\WP_REST_Request $request)
	{
		return array(
			'success'  => true,
			'has_data' => Demo::has_data(),
		);
	}

	/**
	 * Removes all database tables created by the plugin.
	 *
	 * @param \WP_REST_Request $request The REST request object.
	 * @return \WP_REST_Response|array The response message.
	 */
	public function remove(\WP_REST_Request $request)
	{
		// Check user capabilities
		if (! current_user_can('activate_plugins')) {
			Debug::log('Streamery Forms: Database remove - Permission denied for user: ' . get_current_user_id());
			return new \WP_REST_Response(
				array(
					'success' => false,
					'message' => __('You do not have permission to perform this action.', 'streamery-forms'),
				),
				403
			);
		}

		try {
			// Drop tables in reverse order of dependencies. DROP removes the rows.
			Debug::log('Streamery Forms: Starting database table removal...');
			Entries::down();
			EntryLabels::down();
			Mailboxes::down();
			Providers::down();
			Debug::log('Streamery Forms: All database tables removed successfully.');

			return new \WP_REST_Response(
				array(
					'success' => true,
					'message' => __('All database tables have been successfully removed.', 'streamery-forms'),
				),
				200
			);
		} catch (\Exception $e) {
			Debug::log('Streamery Forms: Error removing database tables: ' . $e->getMessage());
			Debug::log('Streamery Forms: Stack trace: ' . $e->getTraceAsString());
			return new \WP_REST_Response(
				array(
					'success' => false,
					'message' => __('Error removing database tables: ', 'streamery-forms') . $e->getMessage(),
				),
				500
			);
		}
	}
}
