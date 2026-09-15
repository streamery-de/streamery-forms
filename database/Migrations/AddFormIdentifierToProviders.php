<?php
/**
 * Database migration for adding form_identifier column to providers table.
 *
 * @package StreameryForms
 * @subpackage Database\Migrations
 * @since 1.0.0
 */

namespace StreameryForms\Database\Migrations;

use StreameryForms\Interfaces\Migration;
use Prappo\WpEloquent\Database\Capsule\Manager as Capsule;
use Prappo\WpEloquent\Database\Schema\Blueprint;

/**
 * Class AddFormIdentifierToProviders
 *
 * Adds form_identifier column and removes UNIQUE constraint on provider_type.
 *
 * @package StreameryForms\Database\Migrations
 */
class AddFormIdentifierToProviders implements Migration {

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
	public static function up() {
		global $wpdb;
		$table_name_prefixed = esc_sql( $wpdb->prefix . self::$table );

		// Capsule adds the WordPress table prefix automatically; pass name without prefix.
		if ( ! Capsule::schema()->hasTable( self::$table ) ) {
			return;
		}

		// Check if column already exists
		$column_exists = Capsule::schema()->hasColumn( self::$table, 'form_identifier' );
		if ( $column_exists ) {
			return;
		}

		$driver = Capsule::connection()->getDriverName();

		// 1. Remove UNIQUE KEY on provider_type (MySQL only; SQLite may not have had it)
		if ( $driver === 'mysql' ) {
			// Table names cannot be bound as prepared-statement parameters.
			// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange, PluginCheck.Security.DirectDB.UnescapedDBParameter
			$index_exists = $wpdb->get_results(
				$wpdb->prepare(
					"SHOW INDEX FROM `{$table_name_prefixed}` WHERE Key_name = %s",
					'uk_provider_type'
				)
			);
			if ( ! empty( $index_exists ) ) {
				$wpdb->query( "ALTER TABLE `{$table_name_prefixed}` DROP INDEX `uk_provider_type`" );
			}
			// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange, PluginCheck.Security.DirectDB.UnescapedDBParameter
		}

		// 2. Add form_identifier column and index (Schema Builder works on MySQL and SQLite)
		Capsule::schema()->table( self::$table, function ( Blueprint $table ) {
			$table->string( 'form_identifier', 100 )->nullable();
			$table->index( 'form_identifier' );
		} );
	}

	/**
	 * Reverse the migrations.
	 *
	 * @return void
	 */
	public static function down() {
		global $wpdb;
		$table_name_prefixed = esc_sql( $wpdb->prefix . self::$table );

		// Capsule adds the WordPress table prefix automatically.
		if ( ! Capsule::schema()->hasTable( self::$table ) ) {
			return;
		}

		Capsule::schema()->table( self::$table, function ( Blueprint $table ) {
			$table->dropIndex( [ 'form_identifier' ] );
			$table->dropColumn( 'form_identifier' );
		} );

		$driver = Capsule::connection()->getDriverName();
		if ( $driver === 'mysql' ) {
			// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange, PluginCheck.Security.DirectDB.UnescapedDBParameter
			$wpdb->query(
				"ALTER TABLE `{$table_name_prefixed}` 
				ADD UNIQUE KEY `uk_provider_type` (`provider_type`)"
			);
			// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange, PluginCheck.Security.DirectDB.UnescapedDBParameter
		}
	}
}

