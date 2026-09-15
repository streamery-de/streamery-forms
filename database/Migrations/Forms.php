<?php

/**
 * Database migration for the forms index table.
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
 * Class Forms
 *
 * Server-side index of every streamery-forms/form block found in post content.
 * This is what makes the submission endpoint authoritative: provider feeds,
 * per-form settings, and the field schema are read from here rather than from
 * whatever the submitting browser sends.
 *
 * @package StreameryForms\Database\Migrations
 */
class Forms implements Migration
{

	/**
	 * Table name for the migration.
	 *
	 * @var string
	 */
	public static $table = 'streamery_forms_forms';

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
			$table->string('form_identifier', 191)->unique();
			$table->unsignedBigInteger('post_id')->nullable();
			$table->longText('config');
			$table->longText('fields');
			$table->dateTime('updated_at');
			$table->index('post_id');
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
