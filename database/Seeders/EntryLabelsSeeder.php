<?php

/**
 * Database seeder for entry labels.
 *
 * @package StreameryForms
 * @subpackage Database\Seeders
 * @since 1.0.0
 */

namespace StreameryForms\Database\Seeders;

use StreameryForms\Models\EntryLabels;

defined('ABSPATH') || exit;

/**
 * Class EntryLabels
 *
 * Represents the seeder for the 'streamery_forms_entry_labels' table.
 *
 * @package StreameryForms\Database\Seeders
 * @since 1.0.0
 */
class EntryLabelsSeeder
{

	/**
	 * Run the database seeds.
	 *
	 * @return void
	 */
	public static function run()
	{
		$current_date = gmdate('Y-m-d H:i:s');

		// Default labels to insert.
		$labels = array(
			array(
				'name'         => 'Important',
				'description'  => 'Mark important entries',
				'color'        => '#ef4444', // Red
				'date_created' => $current_date,
			),
			array(
				'name'         => __('Follow Up', 'streamery-forms'),
				'description'  => __('Entries that need follow-up', 'streamery-forms'),
				'color'        => '#f59e0b', // Amber
				'date_created' => $current_date,
			),
		);

		foreach ($labels as $label) {
			// Check if label already exists by name (unique constraint).
			if (! EntryLabels::where('name', $label['name'])->exists()) {
				EntryLabels::create($label);
			}
		}
	}
}
