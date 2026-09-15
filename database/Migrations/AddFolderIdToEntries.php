<?php

/**
 * Database migration for adding folder_id column to entries table.
 *
 * @package StreameryForms
 * @subpackage Database\Migrations
 * @since 1.0.0
 */

namespace StreameryForms\Database\Migrations;

use StreameryForms\Interfaces\Migration;
use Prappo\WpEloquent\Database\Capsule\Manager as Capsule;
use Prappo\WpEloquent\Database\Schema\Blueprint;

defined('ABSPATH') || exit;

/**
 * Class AddFolderIdToEntries
 *
 * Adds folder_id column to streamery_forms_entries for inbox folder assignment.
 *
 * @package StreameryForms\Database\Migrations
 */
class AddFolderIdToEntries implements Migration
{

	/**
	 * Table name for the migration.
	 *
	 * @var string
	 */
	public static $table = 'streamery_forms_entries';

	/**
	 * Run the migrations.
	 *
	 * @return void
	 */
	public static function up()
	{
		if (!Capsule::schema()->hasTable(self::$table)) {
			return;
		}

		if (Capsule::schema()->hasColumn(self::$table, 'folder_id')) {
			return;
		}

		Capsule::schema()->table(self::$table, function (Blueprint $table) {
			$table->unsignedBigInteger('folder_id')->nullable();
			$table->index('folder_id');
		});
	}

	/**
	 * Reverse the migrations.
	 *
	 * @return void
	 */
	public static function down()
	{
		if (!Capsule::schema()->hasTable(self::$table)) {
			return;
		}

		Capsule::schema()->table(self::$table, function (Blueprint $table) {
			$table->dropIndex(['folder_id']);
			$table->dropColumn('folder_id');
		});
	}
}
