<?php

/**
 * Database migration for providers table.
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
 * Class Providers
 *
 * Represents the migration for creating the 'wp_streamery_forms_providers' table.
 *
 * @package StreameryForms\Database\Migrations
 */
class Providers implements Migration
{

	/**
	 * Table name for the migration.
	 *
	 * @var string
	 */
	public static $table = 'streamery_forms_providers';

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
			$table->string('name', 255);
			$table->string('provider_type', 50);
			$table->string('form_identifier', 100)->nullable();
			$table->longText('settings');
			$table->tinyInteger('is_active')->default(1);
			$table->dateTime('date_created');
			$table->index('provider_type');
			$table->index('form_identifier');
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
