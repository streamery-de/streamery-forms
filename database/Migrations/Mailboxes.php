<?php

/**
 * Database migration for mailboxes table.
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
 * Class Mailboxes
 *
 * Represents the migration for creating the 'wp_streamery_forms_mailboxes' table.
 *
 * @package StreameryForms\Database\Migrations
 */
class Mailboxes implements Migration
{

	/**
	 * Table name for the migration.
	 *
	 * @var string
	 */
	public static $table = 'streamery_forms_mailboxes';

	/**
	 * Run the migrations.
	 *
	 * @return void
	 */
	public static function up()
	{
		// Capsule adds the WordPress table prefix automatically; pass name without prefix.
		if (Capsule::schema()->hasTable(self::$table)) {
			return;
		}

		Capsule::schema()->create(self::$table, function (Blueprint $table) {
			$table->id();
			$table->string('title', 255);
			$table->tinyInteger('is_default')->default(0);
			$table->dateTime('date_created');
			$table->unsignedBigInteger('user_id')->nullable();
			$table->index('is_default');
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
