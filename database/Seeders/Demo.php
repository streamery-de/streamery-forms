<?php

/**
 * Database seeder for demo data.
 *
 * @package StreameryForms
 * @subpackage Database\Seeders
 * @since 1.0.0
 */

namespace StreameryForms\Database\Seeders;

use Prappo\WpEloquent\Database\Capsule\Manager as Capsule;
use StreameryForms\Core\Debug;

defined('ABSPATH') || exit;

/**
 * Class Demo
 *
 * Represents the seeder for demo data from demo.sql.
 *
 * @package StreameryForms\Database\Seeders
 */
class Demo
{

	/**
	 * Run the database seeds.
	 *
	 * @return void
	 */
	public static function run()
	{
		global $wpdb;

		// Read the demo.sql file.
		$demo_file = STREAMERY_FORMS_DIR . 'src/database/seeds/demo.sql';

		if (! file_exists($demo_file)) {
			return;
		}

		$sql_content = file_get_contents($demo_file);

		if (empty($sql_content)) {
			return;
		}

		// Replace table names with WordPress prefix.
		$sql_content = str_replace('`wp_', '`' . $wpdb->prefix, $sql_content);

		// Split SQL statements by semicolon and execute them.
		$statements = array_filter(
			array_map('trim', explode(';', $sql_content)),
			function ($statement) {
				$statement = trim($statement);
				// Remove comments and empty lines.
				$statement = preg_replace('/--.*$/m', '', $statement);
				$statement = trim($statement);
				return ! empty($statement);
			}
		);

		foreach ($statements as $statement) {
			if (empty($statement)) {
				continue;
			}

			try {
				Capsule::connection()->getPdo()->exec($statement);
			} catch (\Exception $e) {
				// Log error but continue with other statements.
				Debug::log('Streamery Forms Demo Seeder Error: ' . $e->getMessage());
			}
		}
	}

	/**
	 * Check if demo data already exists.
	 *
	 * @return bool
	 */
	public static function has_data()
	{
		global $wpdb;
		$table_name = $wpdb->prefix . 'streamery_forms_mailboxes';

		if (! Capsule::schema()->hasTable($table_name)) {
			return false;
		}

		$mailboxes_count = Capsule::table($table_name)
			->where('id', '<=', 3)
			->count();

		return $mailboxes_count > 0;
	}
}
