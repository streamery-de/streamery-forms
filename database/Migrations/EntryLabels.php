<?php

/**
 * Database migration for entry labels tables.
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
 * Class EntryLabels
 *
 * Represents the migration for creating the entry labels tables.
 *
 * @package StreameryForms\Database\Migrations
 */
class EntryLabels implements Migration
{

	/**
	 * Table name for labels.
	 *
	 * @var string
	 */
	public static $labels_table = 'streamery_forms_entry_labels';

	/**
	 * Table name for label relations.
	 *
	 * @var string
	 */
	public static $rel_table = 'streamery_forms_entry_label_rel';

	/**
	 * Run the migrations.
	 *
	 * @return void
	 */
	public static function up()
	{
		// Capsule adds the WordPress table prefix automatically; pass names without prefix.
		// Create labels table.
		if (! Capsule::schema()->hasTable(self::$labels_table)) {
			Capsule::schema()->create(self::$labels_table, function (Blueprint $table) {
				$table->id();
				$table->string('name', 100);
				$table->text('description')->nullable();
				$table->string('color', 7)->default('#000000');
				$table->dateTime('date_created');
				$table->unique('name');
			});
		}

		// Create label relations table.
		if (! Capsule::schema()->hasTable(self::$rel_table)) {
			Capsule::schema()->create(self::$rel_table, function (Blueprint $table) {
				$table->unsignedBigInteger('entry_id');
				$table->unsignedBigInteger('label_id');
				$table->dateTime('date_applied');
				$table->primary(['entry_id', 'label_id']);
				$table->index('label_id');
			});
		}
	}

	/**
	 * Reverse the migrations.
	 *
	 * @return void
	 */
	public static function down()
	{
		Capsule::schema()->dropIfExists(self::$rel_table);
		Capsule::schema()->dropIfExists(self::$labels_table);
	}
}
