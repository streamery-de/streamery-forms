<?php

/**
 * Database migration for inbox folders table.
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
 * Class InboxFolders
 *
 * Represents the migration for creating the 'wp_streamery_forms_inbox_folders' table.
 *
 * @package StreameryForms\Database\Migrations
 */
class InboxFolders implements Migration
{

	/**
	 * Table name for the migration.
	 *
	 * @var string
	 */
	public static $table = 'streamery_forms_inbox_folders';

	/**
	 * Run the migrations.
	 *
	 * @return void
	 */
	public static function up()
	{
		if (Capsule::schema()->hasTable(self::$table)) {
			return;
		}

		Capsule::schema()->create(self::$table, function (Blueprint $table) {
			$table->id();
			$table->unsignedBigInteger('mailbox_id');
			$table->unsignedBigInteger('parent_id')->nullable();
			$table->string('name', 255);
			$table->unsignedInteger('sort_order')->default(0);
			$table->dateTime('date_created');
			$table->index('mailbox_id');
			$table->index('parent_id');
		});
	}

	/**
	 * Reverse the migrations.
	 *
	 * @return void
	 */
	public static function down()
	{
		Capsule::schema()->dropIfExists(self::$table);
	}
}
